-- ComandaGO — criar_pedido: RPC que monta o pedido com preço calculado no banco
--
-- Risco que esta migration fecha: até aqui, "pedidos_insert_publico" (da
-- migration inicial) permitia que o cliente anônimo inserisse uma linha em
-- pedidos diretamente via PostgREST (/rest/v1/pedidos) com QUALQUER
-- subtotal/total/preco por item que quisesse — o cardápio real nunca era
-- consultado. Bastava adulterar o payload no DevTools antes de enviar.
--
-- criar_pedido() recebe só produtoId + quantidade por item (nunca preço) e
-- recalcula subtotal/total a partir da tabela produtos, dentro da própria
-- function. Para isso ser a ÚNICA porta de entrada, a policy de insert
-- direto na tabela precisa sair — senão o cliente pode ignorar a function e
-- inserir na tabela do jeito antigo.

drop policy if exists pedidos_insert_publico on public.pedidos;

create or replace function public.criar_pedido(
  p_tenant_id       uuid,
  p_cliente_nome    text,
  p_cliente_telefone text,
  p_itens           jsonb, -- [{"produtoId": "uuid", "quantidade": int, "observacao": text?}, ...]
  p_tipo            text,
  p_endereco        text,
  p_observacao      text,
  p_forma_pagamento text
)
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido             public.pedidos;
  v_tenant             public.tenants;
  v_item               jsonb;
  v_produto            public.produtos;
  v_quantidade         integer;
  v_itens_calculados   jsonb := '[]'::jsonb;
  v_subtotal           numeric := 0;
  v_taxa_entrega       numeric := 0;
  v_total              numeric;
begin
  if not public.tenant_esta_ativo(p_tenant_id) then
    raise exception 'Loja indisponível no momento.';
  end if;

  select * into v_tenant from public.tenants where id = p_tenant_id;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'O pedido precisa ter ao menos um item.';
  end if;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_quantidade := coalesce((v_item->>'quantidade')::integer, 0);
    if v_quantidade <= 0 then
      raise exception 'Quantidade inválida para um dos itens.';
    end if;

    -- tenant_id = p_tenant_id no where garante, no banco, que não dá pra
    -- pedir produto de outra loja mandando o produtoId errado.
    select * into v_produto
    from public.produtos
    where id = (v_item->>'produtoId')::uuid
      and tenant_id = p_tenant_id
      and ativo = true;

    if not found then
      raise exception 'Produto indisponível no cardápio.';
    end if;

    v_subtotal := v_subtotal + (v_produto.preco * v_quantidade);

    v_itens_calculados := v_itens_calculados || jsonb_build_object(
      'produtoId', v_produto.id,
      'nome', v_produto.nome,
      'precoUnitario', v_produto.preco,
      'quantidade', v_quantidade,
      'observacao', nullif(trim(coalesce(v_item->>'observacao', '')), '')
    );
  end loop;

  if v_subtotal < v_tenant.pedido_minimo then
    raise exception 'Pedido abaixo do mínimo da loja.';
  end if;

  if p_tipo = 'entrega' then
    v_taxa_entrega := v_tenant.taxa_entrega;
  end if;

  v_total := v_subtotal + v_taxa_entrega;

  insert into public.pedidos (
    tenant_id, cliente_nome, cliente_telefone, itens, subtotal,
    taxa_entrega, total, tipo, endereco, observacao, forma_pagamento
  )
  values (
    p_tenant_id, p_cliente_nome, p_cliente_telefone, v_itens_calculados, v_subtotal,
    v_taxa_entrega, v_total, p_tipo, p_endereco, p_observacao, p_forma_pagamento
  )
  returning * into v_pedido;

  return v_pedido;
end;
$$;

comment on function public.criar_pedido(uuid, text, text, jsonb, text, text, text, text) is
  'Único caminho de criação de pedido pelo cliente final (sem login). Recebe produtoId+quantidade por item e recalcula preço/subtotal/taxa a partir de produtos/tenants no próprio banco — nunca confia em preço vindo do cliente. SECURITY DEFINER porque a tabela pedidos não tem mais policy de insert direto para anon.';

grant execute on function public.criar_pedido(uuid, text, text, jsonb, text, text, text, text) to anon, authenticated;
