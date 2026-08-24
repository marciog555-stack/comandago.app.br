import { createFileRoute } from '@tanstack/react-router'

import { resolverContextoPorHost } from '#/application/tenant/resolver-contexto-host'
import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'
import { tenantRepository } from '#/infrastructure/supabase/tenant-repository'

const APEX_DOMAIN = process.env.COMANDAGO_APEX_DOMAIN ?? 'comandago.app.br'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const hostHeader = request.headers.get('host') ?? ''
        const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? ''

        const hostContext: ContextoHost =
          hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')
            ? { modo: 'landing' }
            : await resolverContextoPorHost(hostHeader, APEX_DOMAIN, tenantRepository)

        // Só a loja pública tem sitemap — cardápio ainda é uma página única
        // (categorias/produtos não têm URL própria nesta sessão), então o
        // sitemap por ora só lista a home. Cresce quando existirem rotas
        // por produto/categoria.
        if (hostContext.modo !== 'loja' && hostContext.modo !== 'dominio_custom') {
          return new Response('Not Found', { status: 404 })
        }

        const origem = new URL(request.url).origin
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origem}/</loc>
  </url>
</urlset>
`
        return new Response(xml, {
          headers: { 'content-type': 'application/xml; charset=utf-8' },
        })
      },
    },
  },
})
