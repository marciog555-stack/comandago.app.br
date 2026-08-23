import type { FidelidadeCliente } from '#/domain/fidelidade/fidelidade-cliente'

export interface FidelidadeRepository {
  /** Uso no painel do lojista — RLS já filtra por membro do tenant. Sem acesso anônimo. */
  buscarPorTelefone(tenantId: string, telefone: string): Promise<FidelidadeCliente | null>
  listarPorTenant(tenantId: string): Promise<FidelidadeCliente[]>
}
