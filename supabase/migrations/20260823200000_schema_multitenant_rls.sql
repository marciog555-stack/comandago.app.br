-- ComandaGO — schema inicial multi-tenant + RLS
--
-- Regra inegociável do briefing (seção 4): tenant_id em toda tabela de dados,
-- RLS ativo desde a primeira migration. Um furo aqui vaza pedido, nome,
-- telefone e endereço de cliente de uma loja para outra.
--
-- Decisões de design que vão além do que está literalmente escrito no
-- briefing (para o revisor conferir):
--   1. categorias->produtos: FK composta (categoria_id, tenant_id) garante no
--      banco que um produto nunca referencia uma categoria de outro tenant,
--      mesmo que a aplicação erre.
--   2. tenants: as tabelas base só são legíveis por membros autenticados do
--      próprio tenant (RLS "USING (is_tenant_member(id))"). A leitura pública
--      ("campos de vitrine") é feita pela function tenants_publico(), que
--      expõe só as colunas de vitrine — RLS por si só restringe LINHAS, não
--      COLUNAS, então a separação de colunas sensíveis (plano, criado_em)
--      exige esse mecanismo à parte. Nenhuma tabela usa FORCE ROW LEVEL
--      SECURITY de propósito: isso mantém o dono da migration
--      (postgres/service_role) capaz de bypassar RLS nas suas próprias
--      tabelas, que é o que faz tenants_publico() funcionar (SECURITY
--      DEFINER) e também o que o provisionamento via service_role precisa.
--   3. pedidos.numero é atribuído por trigger (MAX+1 por tenant), nunca pelo
--      cliente. Sob concorrência alta isso pode colidir (race condition);
--      aceitável para o volume esperado (40-60 lojas pequenas), mas registrado
--      aqui como limitação conhecida.
--   4. status/tipo/forma_pagamento de pedidos não têm enumeração definida no
--      briefing; escolhi valores razoáveis via CHECK constraint. Ajustar
--      livremente antes de aplicar em produção.
--   5. slugs reservados bloqueados via CHECK constraint (não trigger) — mais
--      simples e atômico. A lista TEM que ficar em sincronia com
--      src/domain/tenant/reserved-slugs.ts.

-- =============================================================================
-- 1. EXTENSÕES
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- =============================================================================
-- 2. TABELAS
-- =============================================================================
-- (as funções auxiliares de RLS vêm depois das tabelas, na seção 3: funções
-- LANGUAGE SQL têm o corpo validado na criação, então tenant_usuarios precisa
-- já existir antes de public.is_tenant_member ser criada.)

-- ---------------------------------------------------------------------------
-- tenants
-- ---------------------------------------------------------------------------
create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  custom_domain   text,
  nome            text not null,
  logo_url        text,
  cor_primaria    text,
  cor_fundo       text,
  whatsapp        text,
  endereco        text,
  horarios        jsonb not null default '{}'::jsonb,
  taxa_entrega    numeric(10, 2) not null default 0 check (taxa_entrega >= 0),
  pedido_minimo   numeric(10, 2) not null default 0 check (pedido_minimo >= 0),
  ativo           boolean not null default true,
  plano           text not null default 'padrao',
  criado_em       timestamptz not null default now(),

  constraint tenants_slug_formato check (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  constraint tenants_slug_nao_reservado check (
    slug <> all (array['app', 'www', 'api', 'admin', 'painel', 'mail', 'blog', 'static', 'assets', 'cdn'])
  ),
  constraint tenants_custom_domain_formato check (
    custom_domain is null
    or custom_domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
  )
);

create unique index tenants_slug_key on public.tenants (slug);
create unique index tenants_custom_domain_key on public.tenants (custom_domain) where custom_domain is not null;
create index tenants_nome_trgm_idx on public.tenants using gin (nome extensions.gin_trgm_ops);

comment on table public.tenants is 'Uma loja (restaurante) da plataforma. Slug reservado bloqueado por CHECK constraint.';
comment on column public.tenants.custom_domain is 'Domínio próprio (upgrade futuro). Campo existe desde já; feature de roteamento vem depois.';

-- ---------------------------------------------------------------------------
-- tenant_usuarios
-- ---------------------------------------------------------------------------
create table public.tenant_usuarios (
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner', 'staff')),
  criado_em  timestamptz not null default now(),

  primary key (tenant_id, user_id)
);

create index tenant_usuarios_user_id_idx on public.tenant_usuarios (user_id);

comment on table public.tenant_usuarios is 'Vínculo entre auth.users e tenants, com papel (owner/staff).';

-- ---------------------------------------------------------------------------
-- categorias
-- ---------------------------------------------------------------------------
create table public.categorias (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  nome       text not null,
  ordem      integer not null default 0,
  ativo      boolean not null default true,

  -- exigido pela FK composta de produtos (garante que produto e categoria
  -- pertencem sempre ao mesmo tenant, aplicado pelo banco).
  constraint categorias_id_tenant_id_key unique (id, tenant_id)
);

create index categorias_tenant_id_idx on public.categorias (tenant_id);
create index categorias_tenant_ordem_idx on public.categorias (tenant_id, ordem);
create index categorias_nome_trgm_idx on public.categorias using gin (nome extensions.gin_trgm_ops);

comment on table public.categorias is 'Categorias do cardápio de um tenant.';

-- ---------------------------------------------------------------------------
-- produtos
-- ---------------------------------------------------------------------------
create table public.produtos (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  categoria_id  uuid not null,
  nome          text not null,
  descricao     text,
  preco         numeric(10, 2) not null check (preco >= 0),
  imagem_url    text,
  ativo         boolean not null default true,
  ordem         integer not null default 0,

  -- garante no banco que categoria_id pertence ao mesmo tenant_id do produto.
  constraint produtos_categoria_tenant_fk
    foreign key (categoria_id, tenant_id)
    references public.categorias (id, tenant_id)
    on delete cascade
);

create index produtos_tenant_id_idx on public.produtos (tenant_id);
-- composto (categoria_id, tenant_id): cobre a FK produtos_categoria_tenant_fk
-- E continua servindo buscas só por categoria_id (é o prefixo do índice).
create index produtos_categoria_id_tenant_id_idx on public.produtos (categoria_id, tenant_id);
create index produtos_nome_trgm_idx on public.produtos using gin (nome extensions.gin_trgm_ops);

comment on table public.produtos is 'Produtos do cardápio. categoria_id é sempre da mesma tenant_id (FK composta).';

-- ---------------------------------------------------------------------------
-- pedidos
-- ---------------------------------------------------------------------------
create table public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  numero           bigint not null,
  cliente_nome     text not null check (length(trim(cliente_nome)) > 0),
  cliente_telefone text not null check (length(trim(cliente_telefone)) > 0),
  itens            jsonb not null,
  subtotal         numeric(10, 2) not null check (subtotal >= 0),
  taxa_entrega     numeric(10, 2) not null default 0 check (taxa_entrega >= 0),
  total            numeric(10, 2) not null check (total >= 0),
  tipo             text not null check (tipo in ('entrega', 'retirada')),
  endereco         text,
  observacao       text,
  forma_pagamento  text not null,
  status           text not null default 'recebido'
                     check (status in ('recebido', 'em_preparo', 'pronto', 'em_entrega', 'concluido', 'cancelado')),
  criado_em        timestamptz not null default now(),

  constraint pedidos_endereco_obrigatorio_na_entrega
    check (tipo <> 'entrega' or endereco is not null)
);

create index pedidos_tenant_id_idx on public.pedidos (tenant_id);
create index pedidos_tenant_criado_em_idx on public.pedidos (tenant_id, criado_em desc);
create index pedidos_tenant_status_idx on public.pedidos (tenant_id, status);
create index pedidos_cliente_telefone_idx on public.pedidos (tenant_id, cliente_telefone);
create unique index pedidos_tenant_numero_key on public.pedidos (tenant_id, numero);

comment on table public.pedidos is 'Pedidos feitos pelo cliente final (sem login) via cardápio público.';
comment on column public.pedidos.numero is 'Sequencial por tenant, atribuído por trigger (nunca pelo cliente).';

-- numero sempre calculado no servidor — nunca aceita valor vindo do cliente.
create or replace function public.definir_numero_pedido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(max(numero), 0) + 1
  into new.numero
  from public.pedidos
  where tenant_id = new.tenant_id;

  return new;
end;
$$;

create trigger trg_definir_numero_pedido
  before insert on public.pedidos
  for each row
  execute function public.definir_numero_pedido();

-- definir_numero_pedido só deve rodar como trigger (acessa NEW/TG_*, que só
-- existem em contexto de trigger); chamada direta via RPC sempre falharia em
-- runtime, mas revogar o EXECUTE remove o alarme falso do advisor de
-- segurança e deixa explícito que a function não é de uso direto. Revoga de
-- PUBLIC e também de anon/authenticated: o Postgres concede EXECUTE default
-- para functions novas ora via PUBLIC, ora (no bootstrap do Supabase) via
-- ALTER DEFAULT PRIVILEGES nomeando anon/authenticated diretamente —
-- cobrindo os dois casos fica robusto independente de qual se aplicou.
revoke execute on function public.definir_numero_pedido() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- fidelidade_clientes
-- ---------------------------------------------------------------------------
create table public.fidelidade_clientes (
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  telefone       text not null check (length(trim(telefone)) > 0),
  nome           text,
  pontos         integer not null default 0 check (pontos >= 0),
  ultimo_pedido  timestamptz,

  primary key (tenant_id, telefone)
);

create index fidelidade_clientes_tenant_id_idx on public.fidelidade_clientes (tenant_id);

comment on table public.fidelidade_clientes is
  'Pontos de fidelidade por telefone (sem senha, sem cadastro). Chave composta (tenant_id, telefone).';

-- =============================================================================
-- 3. FUNÇÕES AUXILIARES DE RLS
-- =============================================================================
-- SECURITY DEFINER + search_path fixo (recomendação oficial do Supabase) para
-- evitar (a) sequestro de search_path e (b) recursão de RLS: como essas
-- funções são donas de postgres (que não tem FORCE RLS em tenant_usuarios),
-- a consulta interna a tenant_usuarios não reaciona a própria política de
-- tenant_usuarios.

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_usuarios tu
    where tu.tenant_id = p_tenant_id
      and tu.user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_usuarios tu
    where tu.tenant_id = p_tenant_id
      and tu.user_id = auth.uid()
      and tu.role = 'owner'
  );
$$;

comment on function public.is_tenant_member(uuid) is
  'True se o usuário autenticado atual (auth.uid()) é owner ou staff do tenant informado.';
comment on function public.is_tenant_owner(uuid) is
  'True se o usuário autenticado atual (auth.uid()) é owner do tenant informado.';

-- Mesma lógica, mas para "o tenant está ativo?" — usada pelas policies
-- públicas de categorias/produtos/pedidos. Achado pelo teste de isolamento
-- (tests/rls-isolation.sql): um "EXISTS (SELECT 1 FROM tenants WHERE
-- ativo = true)" inline, dentro da própria policy, roda com o privilégio de
-- quem está consultando — e anon/authenticated não tem SELECT na tabela base
-- tenants (só via tenants_publico()). Isso fazia a subquery sempre voltar
-- vazia e bloqueava o cardápio público inteiro, mesmo com ativo = true.
-- SECURITY DEFINER resolve bypassando a RLS de tenants só para essa checagem
-- pontual (o mesmo padrão de is_tenant_member/is_tenant_owner).
create or replace function public.tenant_esta_ativo(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select t.ativo from public.tenants t where t.id = p_tenant_id),
    false
  );
$$;

comment on function public.tenant_esta_ativo(uuid) is
  'True se o tenant existe e está ativo. SECURITY DEFINER para bypassar a RLS de tenants (que não expõe leitura direta a anon).';

-- =============================================================================
-- 4. ROW LEVEL SECURITY — habilitar em todas as tabelas, sem exceção
-- =============================================================================

alter table public.tenants enable row level security;
alter table public.tenant_usuarios enable row level security;
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.pedidos enable row level security;
alter table public.fidelidade_clientes enable row level security;

-- =============================================================================
-- 5. POLICIES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- tenants
-- Leitura pública de "campos de vitrine" é feita via tenants_publico()
-- (seção 6), não pela tabela base. A tabela base só é legível, na íntegra, por membros.
-- Escrita só pelo owner. Sem policy de INSERT/DELETE: provisionamento e
-- exclusão de tenant são feitos via service_role (bypassa RLS), pela futura
-- tela de admin do Márcio.
-- ---------------------------------------------------------------------------
create policy tenants_select_membros
  on public.tenants for select
  to authenticated
  using (public.is_tenant_member(id));

create policy tenants_update_owner
  on public.tenants for update
  to authenticated
  using (public.is_tenant_owner(id))
  with check (public.is_tenant_owner(id));

-- ---------------------------------------------------------------------------
-- tenant_usuarios
-- Não descrito explicitamente no briefing; aplicando o princípio geral
-- "negado por padrão" + menor privilégio: membro vê o quadro de staff do
-- próprio tenant, só owner gerencia (adiciona/remove/muda role).
-- ---------------------------------------------------------------------------
create policy tenant_usuarios_select_membros
  on public.tenant_usuarios for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy tenant_usuarios_insert_owner
  on public.tenant_usuarios for insert
  to authenticated
  with check (public.is_tenant_owner(tenant_id));

create policy tenant_usuarios_update_owner
  on public.tenant_usuarios for update
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy tenant_usuarios_delete_owner
  on public.tenant_usuarios for delete
  to authenticated
  using (public.is_tenant_owner(tenant_id));

-- ---------------------------------------------------------------------------
-- categorias
-- Leitura anônima só quando o tenant está ativo (cardápio público). Membros
-- sempre enxergam a própria categoria, mesmo com tenant inativo (precisam
-- editar o cardápio antes de reativar a loja). Escrita só para membros.
-- ---------------------------------------------------------------------------
create policy categorias_select_publico
  on public.categorias for select
  to anon, authenticated
  using (public.tenant_esta_ativo(tenant_id));

create policy categorias_select_membros
  on public.categorias for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy categorias_insert_membros
  on public.categorias for insert
  to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy categorias_update_membros
  on public.categorias for update
  to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy categorias_delete_membros
  on public.categorias for delete
  to authenticated
  using (public.is_tenant_member(tenant_id));

-- ---------------------------------------------------------------------------
-- produtos
-- Mesmas regras de categorias.
-- ---------------------------------------------------------------------------
create policy produtos_select_publico
  on public.produtos for select
  to anon, authenticated
  using (public.tenant_esta_ativo(tenant_id));

create policy produtos_select_membros
  on public.produtos for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy produtos_insert_membros
  on public.produtos for insert
  to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy produtos_update_membros
  on public.produtos for update
  to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy produtos_delete_membros
  on public.produtos for delete
  to authenticated
  using (public.is_tenant_member(tenant_id));

-- ---------------------------------------------------------------------------
-- pedidos
-- Insert anônimo permitido (cliente final não tem login), mas só se o tenant
-- estiver ativo. Select/update apenas para membros do tenant. Sem policy de
-- delete (pedido nunca é apagado, só muda de status) e sem select/update
-- anônimo — cliente anônimo nunca lê pedido de ninguém, nem o próprio.
-- ---------------------------------------------------------------------------
create policy pedidos_insert_publico
  on public.pedidos for insert
  to anon, authenticated
  with check (public.tenant_esta_ativo(tenant_id));

create policy pedidos_select_membros
  on public.pedidos for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy pedidos_update_membros
  on public.pedidos for update
  to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

-- ---------------------------------------------------------------------------
-- fidelidade_clientes
-- Não está na lista pública de leitura do briefing -> negado por padrão para
-- anon em toda operação. Só membros do tenant leem/escrevem. (A consulta de
-- pontos pelo cliente final, sem login, será uma function/RPC dedicada numa
-- sessão futura — fora do escopo desta fundação.)
-- ---------------------------------------------------------------------------
create policy fidelidade_select_membros
  on public.fidelidade_clientes for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy fidelidade_insert_membros
  on public.fidelidade_clientes for insert
  to authenticated
  with check (public.is_tenant_member(tenant_id));

create policy fidelidade_update_membros
  on public.fidelidade_clientes for update
  to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy fidelidade_delete_membros
  on public.fidelidade_clientes for delete
  to authenticated
  using (public.is_tenant_member(tenant_id));

-- =============================================================================
-- 6. FUNCTION PÚBLICA DE VITRINE (tenants)
-- =============================================================================
-- SECURITY DEFINER: roda com o privilégio do dono (o role que aplica a
-- migration), que não tem FORCE ROW LEVEL SECURITY em tenants e portanto
-- bypassa a RLS da tabela base — expõe só as colunas listadas abaixo (nunca
-- "plano" ou qualquer coluna futura sensível), para todas as linhas. É a
-- ÚNICA porta de entrada pública para dados de tenants.
--
-- Function em vez de view: uma view sem security_invoker é sinalizada como
-- ERROR ("security definer view") pelo linter de segurança do Supabase. Uma
-- function SECURITY DEFINER faz o mesmo bypass intencional mas só gera o WARN
-- esperado ("pode ser chamada por anon/authenticated"), o mesmo já aceito
-- para is_tenant_member/is_tenant_owner. PostgREST expõe functions STABLE
-- via /rest/v1/rpc/tenants_publico com suporte a filtro (?slug=eq.x) e
-- .single(), então a ergonomia de consulta no futuro middleware de hostname
-- é equivalente à de uma view.

create or replace function public.tenants_publico()
returns table (
  id             uuid,
  slug           text,
  custom_domain  text,
  nome           text,
  logo_url       text,
  cor_primaria   text,
  cor_fundo      text,
  whatsapp       text,
  endereco       text,
  horarios       jsonb,
  taxa_entrega   numeric,
  pedido_minimo  numeric,
  ativo          boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id, t.slug, t.custom_domain, t.nome, t.logo_url, t.cor_primaria,
    t.cor_fundo, t.whatsapp, t.endereco, t.horarios, t.taxa_entrega,
    t.pedido_minimo, t.ativo
  from public.tenants t;
$$;

comment on function public.tenants_publico() is
  'Colunas de vitrine de tenants, públicas por design (SECURITY DEFINER: só assim bypassa a RLS da tabela base para expor todas as linhas). Nunca adicionar "plano" ou coluna sensível aqui.';

grant execute on function public.tenants_publico() to anon, authenticated;
