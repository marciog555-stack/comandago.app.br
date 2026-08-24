import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

import { resolverHostContextoDeHeader } from '#/infrastructure/hostname/resolver-host-context'

/**
 * Fallback pro beforeLoad da rota raiz: getGlobalStartContext() só resolve
 * durante o SSR do primeiro carregamento — numa re-execução client-side do
 * beforeLoad (ex: router.invalidate() depois do login), ele vem undefined,
 * e sem isto o host cairia sempre em "landing". Server function faz o RPC
 * de volta pro servidor, que enxerga o Host de verdade da requisição atual.
 */
export const resolverHostContextoFn = createServerFn({ method: 'GET' }).handler(async () => {
  const hostHeader = getRequestHeader('host') ?? ''
  return resolverHostContextoDeHeader(hostHeader)
})
