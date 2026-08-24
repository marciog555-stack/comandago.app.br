-- ComandaGO — consultar_pontos_fidelidade v2: retorna só os pontos (integer)
--
-- Substitui a v1 (migration 20260823210000), que retornava uma linha com
-- telefone/nome/pontos/ultimo_pedido. Mudanças:
--   - retorna só "pontos" (integer) — a tela de consulta não precisa mais
--     de nome/ultimo_pedido por enquanto.
--   - normaliza o telefone recebido (só dígitos) antes de comparar.
--   - só responde se o tenant estiver ativo (tenant_esta_ativo).
--   - valida tamanho do telefone normalizado (10-13 dígitos).
--   - cliente não encontrado e cliente com 0 pontos retornam o mesmo valor
--     (0) — indistinguíveis de propósito, não revela se o telefone existe
--     na base.
--
-- Risco conhecido, aceito por ora (decisão explícita, revisar se der
-- problema na prática): a normalização acontece só no telefone recebido
-- como parâmetro, não no que está gravado em fidelidade_clientes.telefone.
-- Se algum insert futuro gravar o telefone com formatação (parênteses,
-- espaço, traço), a consulta não vai bater e vai devolver 0 em vez do
-- valor real — silencioso. Sem CHECK constraint garantindo o formato
-- normalizado na tabela por decisão do time; whoever escrever o fluxo de
-- "fidelidade automática" (pedidos -> fidelidade_clientes) precisa gravar
-- telefone já normalizado (só dígitos) pra essa function funcionar.

drop function if exists public.consultar_pontos_fidelidade(uuid, text);

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
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
begin
  if not public.tenant_esta_ativo(p_tenant_id) then
    return null;
  end if;

  if length(v_tel) not between 10 and 13 then
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
  'Consulta pública (sem login) dos pontos de UM telefone específico — retorna só o integer de pontos (0 se não encontrado ou tenant inativo/telefone inválido). SECURITY DEFINER para bypassar a RLS de fidelidade_clientes/tenants só para esse lookup pontual.';

grant execute on function public.consultar_pontos_fidelidade(uuid, text) to anon, authenticated;
