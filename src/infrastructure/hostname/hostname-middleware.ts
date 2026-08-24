import { createMiddleware } from '@tanstack/react-start'

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
 * apontado (isso é passo de infra/DNS, fora do escopo desta fundação).
 * Tratados como landing pra não gastar round-trip no Supabase à toa.
 */
function ehHostSemTenant(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')
}

export const hostnameMiddleware = createMiddleware().server(async ({ request, next }) => {
  const hostHeader = request.headers.get('host') ?? ''
  const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? ''

  const hostContext: ContextoHost = ehHostSemTenant(hostname)
    ? { modo: 'landing' }
    : await resolverContextoPorHost(hostHeader, APEX_DOMAIN, tenantRepository)

  return next({ context: { hostContext } })
})
