-- Teste de isolamento entre tenants (RLS)
--
-- Roda direto no SQL Editor do Supabase (ou via `psql`) contra o projeto
-- onde a migration 20260823200000_schema_multitenant_rls.sql já foi
-- aplicada. Não depende de sessão HTTP/PostgREST real: usa
-- "SET LOCAL ROLE" + "SET LOCAL request.jwt.claims", que é exatamente o
-- mecanismo que o PostgREST usa internamente para aplicar RLS a cada
-- request — o teste é fiel ao comportamento em produção.
--
-- Os tenants de teste usam UUID fixo (em vez de gen_random_uuid()) de
-- propósito: assim o script inteiro referencia os ids como literais, sem
-- precisar de nenhum SELECT em public.tenants para "descobrir" o id — o que
-- seria um problema, já que anon/authenticated-não-membro não tem policy de
-- select na tabela base tenants (só via tenants_publico()). Foi exatamente
-- esse tipo de lookup escondido que mascarou o bug real encontrado na
-- primeira rodada deste teste (ver função tenant_esta_ativo() na migration).
--
-- Cenário: dois tenants (A e B), cada um com categoria, produto, pedido e
-- cliente de fidelidade. Tenta ler dados do tenant B:
--   1. autenticado como membro (owner) do tenant A -> deve falhar em
--      pedidos, fidelidade_clientes e na tabela base tenants.
--   2. como usuário anônimo -> deve falhar em pedidos, fidelidade_clientes,
--      tenant_usuarios e na tabela base tenants.
-- produtos/categorias são a EXCEÇÃO documentada: são o cardápio público,
-- legível por qualquer um (membro de outro tenant ou anônimo) sempre que o
-- tenant está ativo — isso não é um vazamento, é a policy pedida no
-- briefing ("leitura anônima permitida apenas quando o tenant está ativo").
--
-- Se qualquer "deve ser 0" abaixo vier >0, ou qualquer "deve ser >0" vier 0,
-- alguma policy está errada — pare e revise antes de aplicar em produção.

-- ---------------------------------------------------------------------------
-- 1. Fixtures: dois tenants completos (+ um terceiro inativo) e um usuário
--    owner por tenant. IDs fixos de propósito (ver nota acima).
-- ---------------------------------------------------------------------------
do $$
declare
  v_tenant_a  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_tenant_b  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_tenant_i  uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc'; -- inativo
  v_user_a    uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b    uuid := '22222222-2222-2222-2222-222222222222';
  v_categoria_a uuid;
  v_categoria_b uuid;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
  )
  values
    (v_user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'owner-a@teste.comandago.app.br', crypt('senha-teste-123', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'owner-b@teste.comandago.app.br', crypt('senha-teste-123', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
  on conflict (id) do nothing;

  insert into public.tenants (id, slug, nome, ativo, whatsapp)
  values (v_tenant_a, 'padaria-teste-a', 'Padaria Teste A', true, '5562900000001');

  insert into public.tenants (id, slug, nome, ativo, whatsapp)
  values (v_tenant_b, 'padaria-teste-b', 'Padaria Teste B', true, '5562900000002');

  insert into public.tenants (id, slug, nome, ativo, whatsapp)
  values (v_tenant_i, 'padaria-teste-inativa', 'Padaria Teste Inativa', false, '5562900000009');

  insert into public.tenant_usuarios (tenant_id, user_id, role) values (v_tenant_a, v_user_a, 'owner');
  insert into public.tenant_usuarios (tenant_id, user_id, role) values (v_tenant_b, v_user_b, 'owner');

  insert into public.categorias (tenant_id, nome) values (v_tenant_a, 'Pães') returning id into v_categoria_a;
  insert into public.categorias (tenant_id, nome) values (v_tenant_b, 'Bolos') returning id into v_categoria_b;

  insert into public.produtos (tenant_id, categoria_id, nome, preco)
  values (v_tenant_a, v_categoria_a, 'Pão Francês', 0.75);
  insert into public.produtos (tenant_id, categoria_id, nome, preco)
  values (v_tenant_b, v_categoria_b, 'Bolo de Cenoura', 35.00);

  insert into public.pedidos (tenant_id, cliente_nome, cliente_telefone, itens, subtotal, total, tipo, forma_pagamento)
  values (v_tenant_a, 'Cliente A', '5562911111111', '[{"produto":"Pão Francês","qtd":10}]'::jsonb, 7.50, 7.50, 'retirada', 'pix');
  insert into public.pedidos (tenant_id, cliente_nome, cliente_telefone, itens, subtotal, total, tipo, forma_pagamento)
  values (v_tenant_b, 'Cliente B', '5562922222222', '[{"produto":"Bolo de Cenoura","qtd":1}]'::jsonb, 35.00, 35.00, 'retirada', 'pix');

  insert into public.fidelidade_clientes (tenant_id, telefone, nome, pontos)
  values (v_tenant_a, '5562911111111', 'Cliente A', 10);
  insert into public.fidelidade_clientes (tenant_id, telefone, nome, pontos)
  values (v_tenant_b, '5562922222222', 'Cliente B', 20);
end $$;

-- ---------------------------------------------------------------------------
-- 2. Membro (owner) do tenant A tentando ler dados do tenant B.
--    "cross-tenant" deve vir 0; "sanidade" (próprio tenant A) deve vir >0
--    — provando que a policy não está bloqueando demais também.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select 'pedidos_tenant_b_como_membro_a — deve ser 0' as cenario, count(*) as linhas
from public.pedidos where tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

union all
select 'fidelidade_tenant_b_como_membro_a — deve ser 0', count(*)
from public.fidelidade_clientes where tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

union all
select 'tenants_row_b_como_membro_a — deve ser 0', count(*)
from public.tenants where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

union all
select 'pedidos_tenant_a_sanidade — deve ser >0', count(*)
from public.pedidos where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

union all
select 'fidelidade_tenant_a_sanidade — deve ser >0', count(*)
from public.fidelidade_clientes where tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

rollback;

-- ---------------------------------------------------------------------------
-- 3. Usuário anônimo tentando ler pedidos/fidelidade de QUALQUER tenant.
--    produtos/categorias/tenants_publico() continuam públicos por design
--    (cardápio ativo) — isso é esperado, não é a brecha que estamos caçando.
-- ---------------------------------------------------------------------------
begin;
set local role anon;
reset request.jwt.claims;

select 'pedidos_qualquer_tenant_anon — deve ser 0' as cenario, count(*) as linhas
from public.pedidos
where tenant_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

union all
select 'fidelidade_qualquer_tenant_anon — deve ser 0', count(*)
from public.fidelidade_clientes
where tenant_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

union all
select 'tenants_tabela_base_anon — deve ser 0', count(*)
from public.tenants
where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

union all
select 'tenant_usuarios_anon — deve ser 0', count(*)
from public.tenant_usuarios
where tenant_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

union all
select 'produtos_publico_anon_sanidade — deve ser >0 (cardápio é público)', count(*)
from public.produtos
where tenant_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

union all
select 'tenants_publico_function_anon_sanidade — deve ser >0 (vitrine é pública)', count(*)
from public.tenants_publico()
where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

rollback;

-- ---------------------------------------------------------------------------
-- 4. Insert público de pedido: permitido em tenant ativo, bloqueado em
--    tenant inativo (o bloqueio deve aparecer como ERRO 42501, não como
--    "0 linhas afetadas" silencioso).
-- ---------------------------------------------------------------------------
begin;
set local role anon;
reset request.jwt.claims;

with ins as (
  insert into public.pedidos (tenant_id, cliente_nome, cliente_telefone, itens, subtotal, total, tipo, forma_pagamento)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cliente Anônimo', '5562933333333', '[{"produto":"x"}]'::jsonb, 1, 1, 'retirada', 'pix')
  returning 1
)
select 'insert_pedido_anon_tenant_ativo — deve ser 1' as cenario, count(*) as linhas from ins;

rollback;

-- este bloco DEVE terminar em erro 42501 ("new row violates row-level
-- security policy") — se não der erro, pedidos_insert_publico está errada.
begin;
set local role anon;
reset request.jwt.claims;

insert into public.pedidos (tenant_id, cliente_nome, cliente_telefone, itens, subtotal, total, tipo, forma_pagamento)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cliente Anônimo', '5562933333333', '[{"produto":"x"}]'::jsonb, 1, 1, 'retirada', 'pix');

rollback;

-- ---------------------------------------------------------------------------
-- 5. Limpeza dos fixtures.
-- ---------------------------------------------------------------------------
delete from public.tenants where slug in ('padaria-teste-a', 'padaria-teste-b', 'padaria-teste-inativa');
delete from auth.users where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
