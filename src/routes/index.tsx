import { createFileRoute } from '@tanstack/react-router'

import { buscarCardapioPublico } from '#/application/cardapio/buscar-cardapio-publico'
import type { CategoriaComProdutos } from '#/application/cardapio/buscar-cardapio-publico'
import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'
import { calcularStatusLoja } from '#/domain/tenant/status-loja'
import { categoriaRepository } from '#/infrastructure/supabase/categoria-repository'
import { produtoRepository } from '#/infrastructure/supabase/produto-repository'
import { CardapioPublico } from '#/presentation/components/cardapio/cardapio-publico'
import { gerarJsonLdRestaurante } from '#/presentation/seo/json-ld-restaurante'

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    const { hostContext } = context

    if (hostContext.modo === 'loja' || hostContext.modo === 'dominio_custom') {
      const categorias = await buscarCardapioPublico(
        hostContext.tenant.id,
        categoriaRepository,
        produtoRepository,
      )
      return { hostContext, categorias }
    }

    return { hostContext, categorias: [] as Array<CategoriaComProdutos> }
  },
  head: ({ match }) => {
    const { hostContext, categorias } = match.loaderData ?? {
      hostContext: { modo: 'landing' } as ContextoHost,
      categorias: [] as Array<CategoriaComProdutos>,
    }

    if (hostContext.modo !== 'loja' && hostContext.modo !== 'dominio_custom') {
      return {}
    }

    const { tenant } = hostContext
    // "GO" fixo: única praça do v1 é Anápolis-GO (seção 1 do briefing).
    const titulo = `${tenant.nome} — Cardápio | ${tenant.cidade}, GO`
    const descricao = `Cardápio de ${tenant.nome} em ${tenant.cidade}, GO. Peça direto pelo WhatsApp, sem taxa por pedido.`

    return {
      meta: [
        { title: titulo },
        { name: 'description', content: descricao },
        { property: 'og:title', content: titulo },
        { property: 'og:description', content: descricao },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'pt_BR' },
        ...(tenant.logoUrl ? [{ property: 'og:image', content: tenant.logoUrl }] : []),
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(gerarJsonLdRestaurante(tenant, categorias)),
        },
      ],
    }
  },
  component: Home,
})

function Home() {
  const { hostContext, categorias } = Route.useLoaderData()

  if (hostContext.modo === 'loja' || hostContext.modo === 'dominio_custom') {
    return (
      <CardapioPublico
        tenant={hostContext.tenant}
        status={calcularStatusLoja(hostContext.tenant.horarios)}
        categorias={categorias}
      />
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">ComandaGO</h1>
      <p className="mt-4 text-lg">Fundação em construção — sem UI ainda.</p>
      <p className="mt-2 text-sm text-neutral-500">{descreverModo(hostContext)}</p>
    </div>
  )
}

function descreverModo(hostContext: ContextoHost): string {
  switch (hostContext.modo) {
    case 'landing':
      return 'Host resolvido: landing de vendas.'
    case 'painel':
      return 'Host resolvido: painel do lojista.'
    case 'loja_nao_encontrada':
      return 'Host resolvido: subdomínio sem loja correspondente.'
    case 'nao_encontrado':
      return 'Host resolvido: nenhum tenant encontrado para este host.'
    default:
      return ''
  }
}
