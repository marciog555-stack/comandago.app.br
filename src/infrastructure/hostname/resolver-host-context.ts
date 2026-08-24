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
 * toa.
 */
function ehHostSemTenant(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')
}

/** Compartilhado pelo middleware global, pelo fallback client-side (resolver-host-context-fn.ts) e por robots.txt/sitemap.xml. */
export async function resolverHostContextoDeHeader(hostHeader: string): Promise<ContextoHost> {
  const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? ''
  return ehHostSemTenant(hostname)
    ? { modo: 'landing' }
    : resolverContextoPorHost(hostHeader, APEX_DOMAIN, tenantRepository)
}
