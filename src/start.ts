import { createStart } from '@tanstack/react-start'

import { hostnameMiddleware } from '#/infrastructure/hostname/hostname-middleware'

export const startInstance = createStart(() => ({
  requestMiddleware: [hostnameMiddleware],
}))
