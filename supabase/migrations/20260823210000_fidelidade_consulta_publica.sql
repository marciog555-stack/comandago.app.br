-- ComandaGO — consulta pública de pontos de fidelidade
--
-- fidelidade_clientes não tem nenhuma policy de leitura anônima (o briefing
-- não pede uma — "Políticas RLS" só lista categorias/produtos/pedidos/tenants
-- como público). Isso deixa o cliente final sem como consultar os próprios
-- pontos sem ser membro logado do tenant, o que contradiz a seção 4:
-- "identificação só pelo WhatsApp [...] Esse é o diferencial competitivo
-- mais forte do produto" — a consulta tem que funcionar sem login.
--
-- Solução: uma function SECURITY DEFINER que devolve os pontos de UM
-- telefone específico (nunca lista todos os clientes do tenant). Mesmo
-- padrão de tenants_publico()/tenant_esta_ativo() já usado na migration
-- anterior — bypassa a RLS de fidelidade_clientes só para esse lookup
-- pontual, exatamente com o mesmo escopo (tenant_id, telefone) da chave
-- primária da tabela.
--
-- Trade-off aceito de propósito, coerente com o resto do produto: quem sabe
-- o telefone do cliente consegue ver nome e pontos dele — é o mesmo modelo
-- de identificação "sem senha, sem cadastro" que já vale pro pedido em si
-- (cliente_nome/cliente_telefone ficam no pedido, também sem autenticação).
-- Não é uma tabela pública enumerável: não dá pra listar todos os clientes,
-- só consultar um telefone exato por vez.

create or replace function public.consultar_pontos_fidelidade(p_tenant_id uuid, p_telefone text)
returns table (
  telefone       text,
  nome           text,
  pontos         integer,
  ultimo_pedido  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.telefone, f.nome, f.pontos, f.ultimo_pedido
  from public.fidelidade_clientes f
  where f.tenant_id = p_tenant_id
    and f.telefone = p_telefone;
$$;

comment on function public.consultar_pontos_fidelidade(uuid, text) is
  'Consulta pública (sem login) dos pontos de UM telefone específico. SECURITY DEFINER para bypassar a RLS de fidelidade_clientes só para esse lookup pontual — nunca lista todos os clientes do tenant.';

grant execute on function public.consultar_pontos_fidelidade(uuid, text) to anon, authenticated;
