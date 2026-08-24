import { resolverContextoPorHost } from '#/application/tenant/resolver-contexto-host'
import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'
import { tenantRepository } from '#/infrastructure/supabase/tenant-repository'

/**
 * Nunca prefixar com VITE_: só o servidor precisa disso, e um domínio de
 * apex não é segredo, mas também não tem por que ir pro bundle do cliente.
 */
const APEX_DOMAIN = process.env.COMANDAGO_APEX_DOMAIN ?? 'comandago.app.br'

/**
 * Hosts que ainda não têm tenant nenhum de verdade por trás — dev local e
 * preview da Vercel, antes do domínio comandago.app.br estar de fato
 * apontado. Tratados como landing pra não gastar round-trip no Supabase à
 * toa — exceto quando um parâmetro de preview força um modo específico (ver
 * resolverModoPreview), pra dar pra demonstrar loja/painel sem domínio
 * próprio.
 */
function ehHostSemTenant(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')
}

/**
 * Preview sem domínio próprio: em *.vercel.app não existe subdomínio de
 * verdade (`loja.comandagoappbr.vercel.app` não é algo que dá pra apontar
 * sem ser dono do domínio), então "?loja=slug" e "?painel=1" na URL viram
 * o jeito de ver loja/painel funcionando antes de comandago.app.br estar
 * no ar. Nunca interfere em host real (custom domain/subdomínio) — só
 * quando o host já caiu no bucket "sem tenant".
 */
async function resolverModoPreview(searchParams: URLSearchParams): Promise<ContextoHost | null> {
  const slug = searchParams.get('loja')
  if (slug) {
    const tenant = await tenantRepository.buscarPublicoPorSlug(slug)
    return tenant ? { modo: 'loja', tenant } : { modo: 'loja_nao_encontrada' }
  }

  if (searchParams.get('painel') === '1') {
    return { modo: 'painel' }
  }

  return null
}

/** Compartilhado pelo middleware global, pelo fallback client-side (resolver-host-context-fn.ts) e por robots.txt/sitemap.xml. */
export async function resolverHostContextoDeHeader(
  hostHeader: string,
  requestUrl?: string | URL,
): Promise<ContextoHost> {
  const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? ''

  if (ehHostSemTenant(hostname)) {
    const searchParams = requestUrl ? new URL(requestUrl).searchParams : new URLSearchParams()
    const preview = await resolverModoPreview(searchParams)
    return preview ?? { modo: 'landing' }
  }

  return resolverContextoPorHost(hostHeader, APEX_DOMAIN, tenantRepository)
}
