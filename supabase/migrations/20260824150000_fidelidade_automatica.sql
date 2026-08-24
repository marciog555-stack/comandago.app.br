-- ComandaGO — fidelidade automática: pontos creditados ao criar o pedido
--
-- Fecha o risco já documentado na migration 20260823220000 ("quem escrever
-- o fluxo de fidelidade automática precisa gravar telefone já
-- normalizado"): o upsert abaixo usa exatamente a mesma normalização
-- (regexp_replace \D) que consultar_pontos_fidelidade já usa pra comparar,
-- então o que for creditado aqui SEMPRE é encontrado na consulta pública.
--
-- Regra de pontuação (não especificada no briefing — decisão explícita,
-- fácil de trocar depois): 1 ponto por pedido criado, não por valor gasto.
-- Modelo "cartão fidelidade" simples, familiar pro cliente de lanchonete
-- pequena. Ajustar aqui e só aqui se o modelo mudar (ex: pontos por real).
--
-- Telefone claramente inválido (normalizado com menos de 10 ou mais de 13
-- dígitos) não credita ponto — silencioso, não interrompe o pedido. Sem
-- essa guarda, um telefone digitado errado quebraria a criação do pedido
-- inteiro (fidelidade_clientes.telefone tem CHECK de não-vazio, e uma
-- exceção aqui reverteria toda a transação de criar_pedido).

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
  v_telefone_normalizado text;
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

  -- fidelidade automática: 1 ponto por pedido, telefone sempre normalizado
  -- (só dígitos) pra bater com consultar_pontos_fidelidade.
  v_telefone_normalizado := regexp_replace(coalesce(p_cliente_telefone, ''), '\D', '', 'g');

  if length(v_telefone_normalizado) between 10 and 13 then
    insert into public.fidelidade_clientes (tenant_id, telefone, nome, pontos, ultimo_pedido)
    values (p_tenant_id, v_telefone_normalizado, p_cliente_nome, 1, now())
    on conflict (tenant_id, telefone)
    do update set
      pontos = public.fidelidade_clientes.pontos + 1,
      nome = excluded.nome,
      ultimo_pedido = excluded.ultimo_pedido;
  end if;

  return v_pedido;
end;
$$;

comment on function public.criar_pedido(uuid, text, text, jsonb, text, text, text, text) is
  'Único caminho de criação de pedido pelo cliente final (sem login). Recebe produtoId+quantidade por item e recalcula preço/subtotal/taxa a partir de produtos/tenants no próprio banco — nunca confia em preço vindo do cliente. Credita 1 ponto de fidelidade automaticamente (telefone normalizado). SECURITY DEFINER porque a tabela pedidos não tem policy de insert direto para anon.';
