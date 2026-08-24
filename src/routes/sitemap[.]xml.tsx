import { createFileRoute } from '@tanstack/react-router'

import { resolverHostContextoDeHeader } from '#/infrastructure/hostname/resolver-host-context'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const hostContext = await resolverHostContextoDeHeader(request.headers.get('host') ?? '')

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
