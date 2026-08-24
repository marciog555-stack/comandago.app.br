import { createFileRoute } from '@tanstack/react-router'

import { categoriaRepositoryPainel } from '#/infrastructure/supabase/categoria-repository-painel'
import { exigirSessaoPainel } from '#/presentation/painel/proteger-rota-painel'
import { PainelLayout } from '#/presentation/components/painel/painel-layout'
import { CategoriasPainel } from '#/presentation/components/painel/categorias-painel'

export const Route = createFileRoute('/categorias')({
  loader: async () => {
    const sessao = await exigirSessaoPainel()
    return { sessao }
  },
  component: CategoriasPage,
})

function CategoriasPage() {
  const { sessao } = Route.useLoaderData()
  return (
    <PainelLayout sessao={sessao}>
      <CategoriasPainel tenantId={sessao.tenantId} repositorio={categoriaRepositoryPainel} />
    </PainelLayout>
  )
}
