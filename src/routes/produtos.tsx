import { createFileRoute } from '@tanstack/react-router'

import { categoriaRepositoryPainel } from '#/infrastructure/supabase/categoria-repository-painel'
import { produtoRepositoryPainel } from '#/infrastructure/supabase/produto-repository-painel'
import { exigirSessaoPainel } from '#/presentation/painel/proteger-rota-painel'
import { PainelLayout } from '#/presentation/components/painel/painel-layout'
import { ProdutosPainel } from '#/presentation/components/painel/produtos-painel'

export const Route = createFileRoute('/produtos')({
  loader: async () => {
    const sessao = await exigirSessaoPainel()
    return { sessao }
  },
  component: ProdutosPage,
})

function ProdutosPage() {
  const { sessao } = Route.useLoaderData()
  return (
    <PainelLayout sessao={sessao}>
      <ProdutosPainel
        tenantId={sessao.tenantId}
        repositorio={produtoRepositoryPainel}
        categoriaRepositorio={categoriaRepositoryPainel}
      />
    </PainelLayout>
  )
}
