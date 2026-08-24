-- ComandaGO — normaliza também o DDI (55) do telefone
--
-- Achado testando a fidelidade automática (migration anterior): um mesmo
-- cliente digitando o telefone às vezes com "+55" e às vezes sem (ex: "62
-- 99999-1234" vs "+55 62 99999-1234") virava DOIS registros diferentes em
-- fidelidade_clientes ("62999991234" e "5562999991234") — cada pedido
-- creditando um cliente "diferente", quebrando o propósito do programa de
-- pontos. A normalização anterior (só \D) não cobria isso.
--
-- normalizar_telefone() centraliza a regra (só dígitos + remove DDI 55
-- quando reconhecível: 12-13 dígitos começando com 55) pra
-- consultar_pontos_fidelidade e criar_pedido nunca divergirem de novo.
-- Faixa válida pós-normalização: 10-11 dígitos (DDD + fixo/celular
-- brasileiro).

create or replace function public.normalizar_telefone(p_telefone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when length(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')) in (12, 13)
     and left(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), 2) = '55'
    then substring(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g') from 3)
    else regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')
  end;
$$;

comment on function public.normalizar_telefone(text) is
  'Só dígitos, sem DDI 55 quando reconhecível (12-13 dígitos começando com 55 -> remove os 2 primeiros). Usada por consultar_pontos_fidelidade e criar_pedido pra nunca tratar "62999991234" e "5562999991234" como clientes diferentes.';

-- ---------------------------------------------------------------------------
-- consultar_pontos_fidelidade: mesma assinatura/comportamento, só troca a
-- normalização inline pela function compartilhada e ajusta a faixa válida
-- (10-11 dígitos pós-remoção do DDI, não mais 10-13).
-- ---------------------------------------------------------------------------
create or replace function public.consultar_pontos_fidelidade(
  p_tenant_id uuid,
  p_telefone  text
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tel text := public.normalizar_telefone(p_telefone);
begin
  if not public.tenant_esta_ativo(p_tenant_id) then
    return null;
  end if;

  if length(v_tel) not between 10 and 11 then
    return null;
  end if;

  return coalesce(
    (select f.pontos
       from public.fidelidade_clientes f
      where f.tenant_id = p_tenant_id
        and f.telefone  = v_tel),
    0
  );
end;
$$;

comment on function public.consultar_pontos_fidelidade(uuid, text) is
  'Consulta pública (sem login) dos pontos de UM telefone específico — retorna só o integer de pontos (0 se não encontrado ou tenant inativo/telefone inválido). SECURITY DEFINER para bypassar a RLS de fidelidade_clientes/tenants só para esse lookup pontual. Telefone normalizado via normalizar_telefone() (remove DDI 55 quando presente).';

grant execute on function public.consultar_pontos_fidelidade(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- criar_pedido: mesma lógica da migration anterior, só troca a
-- normalização inline pela function compartilhada e ajusta a faixa válida.
-- ---------------------------------------------------------------------------
create or replace function public.criar_pedido(
  p_tenant_id       uuid,
  p_cliente_nome    text,
  p_cliente_telefone text,
  p_itens           jsonb,
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

  v_telefone_normalizado := public.normalizar_telefone(p_cliente_telefone);

  if length(v_telefone_normalizado) between 10 and 11 then
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
  'Único caminho de criação de pedido pelo cliente final (sem login). Recebe produtoId+quantidade por item e recalcula preço/subtotal/taxa a partir de produtos/tenants no próprio banco — nunca confia em preço vindo do cliente. Credita 1 ponto de fidelidade automaticamente (telefone normalizado via normalizar_telefone()). SECURITY DEFINER porque a tabela pedidos não tem policy de insert direto para anon.';
