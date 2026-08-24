import { createMiddleware } from '@tanstack/react-start'

import { resolverHostContextoDeHeader } from '#/infrastructure/hostname/resolver-host-context'

export const hostnameMiddleware = createMiddleware().server(async ({ request, next }) => {
  const hostHeader = request.headers.get('host') ?? ''
  const hostContext = await resolverHostContextoDeHeader(hostHeader, request.url)
  return next({ context: { hostContext } })
})
