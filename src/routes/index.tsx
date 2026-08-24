import { createFileRoute } from '@tanstack/react-router'

import { buscarCardapioPublico } from '#/application/cardapio/buscar-cardapio-publico'
import type { CategoriaComProdutos } from '#/application/cardapio/buscar-cardapio-publico'
import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'
import { calcularStatusLoja } from '#/domain/tenant/status-loja'
import { categoriaRepository } from '#/infrastructure/supabase/categoria-repository'
import { produtoRepository } from '#/infrastructure/supabase/produto-repository'
import { obterSessaoPainelFn } from '#/infrastructure/supabase/sessao-painel'
import type { SessaoPainel } from '#/infrastructure/supabase/sessao-painel'
import { CardapioPublico } from '#/presentation/components/cardapio/cardapio-publico'
import { LoginForm } from '#/presentation/components/painel/login-form'
import { PainelLayout } from '#/presentation/components/painel/painel-layout'
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
      return { hostContext, categorias, sessao: null }
    }

    if (hostContext.modo === 'painel') {
      const sessao = await obterSessaoPainelFn()
      return { hostContext, categorias: [] as Array<CategoriaComProdutos>, sessao }
    }

    return { hostContext, categorias: [] as Array<CategoriaComProdutos>, sessao: null }
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
  const { hostContext, categorias, sessao } = Route.useLoaderData()

  if (hostContext.modo === 'loja' || hostContext.modo === 'dominio_custom') {
    return (
      <CardapioPublico
        tenant={hostContext.tenant}
        status={calcularStatusLoja(hostContext.tenant.horarios)}
        categorias={categorias}
      />
    )
  }

  if (hostContext.modo === 'painel') {
    return sessao ? <PainelHome sessao={sessao} /> : <LoginForm />
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">ComandaGO</h1>
      <p className="mt-4 text-lg">Fundação em construção — sem UI ainda.</p>
      <p className="mt-2 text-sm text-neutral-500">{descreverModo(hostContext)}</p>
    </div>
  )
}

function PainelHome({ sessao }: { sessao: SessaoPainel }) {
  return (
    <PainelLayout sessao={sessao}>
      <h1 className="text-xl font-bold">Bem-vindo(a), {sessao.tenantNome}</h1>
      <p className="mt-2 text-neutral-600">
        Use o menu acima pra gerenciar categorias, produtos, horários e aparência da sua loja.
      </p>
    </PainelLayout>
  )
}

function descreverModo(hostContext: ContextoHost): string {
  switch (hostContext.modo) {
    case 'landing':
      return 'Host resolvido: landing de vendas.'
    case 'loja_nao_encontrada':
      return 'Host resolvido: subdomínio sem loja correspondente.'
    case 'nao_encontrado':
      return 'Host resolvido: nenhum tenant encontrado para este host.'
    default:
      return ''
  }
}
