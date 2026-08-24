import { createFileRoute } from '@tanstack/react-router'

import { resolverContextoPorHost } from '#/application/tenant/resolver-contexto-host'
import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'
import { tenantRepository } from '#/infrastructure/supabase/tenant-repository'

const APEX_DOMAIN = process.env.COMANDAGO_APEX_DOMAIN ?? 'comandago.app.br'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const hostHeader = request.headers.get('host') ?? ''
        const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? ''

        const hostContext: ContextoHost =
          hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')
            ? { modo: 'landing' }
            : await resolverContextoPorHost(hostHeader, APEX_DOMAIN, tenantRepository)

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
