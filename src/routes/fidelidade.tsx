import { createFileRoute } from '@tanstack/react-router'

import { fidelidadeConsultaRepository } from '#/infrastructure/supabase/fidelidade-consulta-repository'
import { ConsultaFidelidade } from '#/presentation/components/fidelidade/consulta-fidelidade'

export const Route = createFileRoute('/fidelidade')({
  loader: async ({ context }) => ({ hostContext: context.hostContext }),
  component: FidelidadePage,
})

function FidelidadePage() {
  const { hostContext } = Route.useLoaderData()

  if (hostContext.modo !== 'loja' && hostContext.modo !== 'dominio_custom') {
    return (
      <div className="p-8">
        <p className="text-lg">Página não encontrada.</p>
      </div>
    )
  }

  return <ConsultaFidelidade tenant={hostContext.tenant} repositorio={fidelidadeConsultaRepository} />
}
