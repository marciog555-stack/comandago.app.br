import { createFileRoute } from '@tanstack/react-router'

import { tenantRepositoryPainel } from '#/infrastructure/supabase/tenant-repository-painel'
import { exigirSessaoPainel } from '#/presentation/painel/proteger-rota-painel'
import { PainelLayout } from '#/presentation/components/painel/painel-layout'
import { AparenciaPainel } from '#/presentation/components/painel/aparencia-painel'

export const Route = createFileRoute('/aparencia')({
  loader: async () => {
    const sessao = await exigirSessaoPainel()
    return { sessao }
  },
  component: AparenciaPage,
})

function AparenciaPage() {
  const { sessao } = Route.useLoaderData()
  return (
    <PainelLayout sessao={sessao}>
      <AparenciaPainel tenantId={sessao.tenantId} repositorio={tenantRepositoryPainel} />
    </PainelLayout>
  )
}
