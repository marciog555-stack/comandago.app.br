import { createFileRoute } from '@tanstack/react-router'

import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { hostContext } = Route.useRouteContext()

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
    case 'loja':
      return `Host resolvido: loja "${hostContext.tenant.nome}" (${hostContext.tenant.slug}).`
    case 'dominio_custom':
      return `Host resolvido: loja "${hostContext.tenant.nome}" via domínio próprio.`
    case 'loja_nao_encontrada':
      return 'Host resolvido: subdomínio sem loja correspondente.'
    case 'nao_encontrado':
      return 'Host resolvido: nenhum tenant encontrado para este host.'
  }
}
