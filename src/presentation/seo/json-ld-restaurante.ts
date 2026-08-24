import type { TenantPublico } from '#/domain/tenant/tenant'
import type { CategoriaComProdutos } from '#/application/cardapio/buscar-cardapio-publico'

/**
 * JSON-LD Restaurant + Menu (schema.org) — requisito de SEO da seção 5 do
 * briefing. "GO" fixo de propósito: única praça do v1 é Anápolis-GO
 * (seção 1); vira campo quando o produto expandir de estado.
 */
export function gerarJsonLdRestaurante(tenant: TenantPublico, categorias: CategoriaComProdutos[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: tenant.nome,
    ...(tenant.logoUrl ? { image: tenant.logoUrl } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(tenant.endereco ? { streetAddress: tenant.endereco } : {}),
      addressLocality: tenant.cidade,
      addressRegion: 'GO',
      addressCountry: 'BR',
    },
    ...(tenant.whatsapp ? { telephone: tenant.whatsapp } : {}),
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: categorias.map((categoria) => ({
        '@type': 'MenuSection',
        name: categoria.nome,
        hasMenuItem: categoria.produtos.map((produto) => ({
          '@type': 'MenuItem',
          name: produto.nome,
          ...(produto.descricao ? { description: produto.descricao } : {}),
          offers: {
            '@type': 'Offer',
            price: produto.preco.toFixed(2),
            priceCurrency: 'BRL',
          },
        })),
      })),
    },
  }
}
