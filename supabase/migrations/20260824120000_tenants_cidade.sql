-- ComandaGO — adiciona "cidade" em tenants
--
-- Necessário pro SEO do cardápio público (seção 5 do briefing: "H1 com nome
-- da loja + cidade"). Não estava na lista de colunas da seção 4, mas sem
-- essa coluna o H1/JSON-LD teria que chutar a cidade no código da
-- aplicação — e o próprio briefing já dá o precedente de "adicionar campo
-- agora é trivial; depois, com clientes no ar, não" (mesmo raciocínio do
-- custom_domain). Default 'Anápolis' porque é a praça inicial (seção 1);
-- não bloqueia expansão futura pra outras cidades.

alter table public.tenants
  add column cidade text not null default 'Anápolis';

comment on column public.tenants.cidade is
  'Cidade da loja, usada no H1/JSON-LD do cardápio público (SEO). Default "Anápolis" (praça inicial).';

-- tenants_publico() precisa expor a coluna nova. Mudar as colunas de saída
-- de um RETURNS TABLE não é permitido via CREATE OR REPLACE (Postgres
-- recusa com 42P13 "cannot change return type") — precisa dropar antes.
drop function if exists public.tenants_publico();

create or replace function public.tenants_publico()
returns table (
  id             uuid,
  slug           text,
  custom_domain  text,
  nome           text,
  cidade         text,
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
    t.id, t.slug, t.custom_domain, t.nome, t.cidade, t.logo_url, t.cor_primaria,
    t.cor_fundo, t.whatsapp, t.endereco, t.horarios, t.taxa_entrega,
    t.pedido_minimo, t.ativo
  from public.tenants t;
$$;

comment on function public.tenants_publico() is
  'Colunas de vitrine de tenants, públicas por design (SECURITY DEFINER: só assim bypassa a RLS da tabela base para expor todas as linhas). Nunca adicionar "plano" ou coluna sensível aqui.';

grant execute on function public.tenants_publico() to anon, authenticated;
