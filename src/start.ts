import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

import { hostnameMiddleware } from '#/infrastructure/hostname/hostname-middleware'

/**
 * Sem isto, server functions (entrarFn, sairFn, etc.) aceitariam POST
 * cross-origin — um site malicioso poderia forçar login/logout de quem
 * estivesse com a aba do painel aberta (CSRF). Padrão same-origin (mesma
 * origem) já cobre o caso de uso real: o painel só chama suas próprias
 * server functions a partir de si mesmo.
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [
    hostnameMiddleware,
    // filter: só valida chamadas de server function (entrarFn, sairFn, ...),
    // nunca requisições normais de página — sem isso, toda navegação (GET
    // de "/", robots.txt etc, que não tem Sec-Fetch-Site "same-origin" nem
    // Referer numa navegação direta) seria rejeitada com 403.
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' }),
  ],
}))
