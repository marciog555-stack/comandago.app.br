import { createFileRoute } from '@tanstack/react-router'

import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'
import { resolverHostContextoDeHeader } from '#/infrastructure/hostname/resolver-host-context'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const hostContext = await resolverHostContextoDeHeader(request.headers.get('host') ?? '', request.url)

        return new Response(gerarRobotsTxt(hostContext, new URL(request.url).origin), {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        })
      },
    },
  },
})

function gerarRobotsTxt(hostContext: ContextoHost, origem: string): string {
  // painel do lojista: área privada, nunca deve ser indexada.
  if (hostContext.modo === 'painel') {
    return 'User-agent: *\nDisallow: /\n'
  }

  // loja ativa e encontrada: pública, com sitemap.
  if (hostContext.modo === 'loja' || hostContext.modo === 'dominio_custom') {
    return `User-agent: *\nAllow: /\nSitemap: ${origem}/sitemap.xml\n`
  }

  // landing de vendas, slug sem loja ou host desconhecido: público, sem sitemap dedicado ainda.
  return 'User-agent: *\nAllow: /\n'
}
