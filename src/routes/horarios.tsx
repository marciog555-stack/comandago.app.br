import { createFileRoute } from '@tanstack/react-router'

import { tenantRepositoryPainel } from '#/infrastructure/supabase/tenant-repository-painel'
import { exigirSessaoPainel } from '#/presentation/painel/proteger-rota-painel'
import { PainelLayout } from '#/presentation/components/painel/painel-layout'
import { HorariosPainel } from '#/presentation/components/painel/horarios-painel'

export const Route = createFileRoute('/horarios')({
  loader: async () => {
    const sessao = await exigirSessaoPainel()
    return { sessao }
  },
  component: HorariosPage,
})

function HorariosPage() {
  const { sessao } = Route.useLoaderData()
  return (
    <PainelLayout sessao={sessao}>
      <HorariosPainel tenantId={sessao.tenantId} repositorio={tenantRepositoryPainel} />
    </PainelLayout>
  )
}
