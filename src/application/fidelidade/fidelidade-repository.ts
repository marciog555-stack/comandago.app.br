import type { FidelidadeCliente } from '#/domain/fidelidade/fidelidade-cliente'

export interface FidelidadeRepository {
  /** Uso no painel do lojista — RLS já filtra por membro do tenant. Sem acesso anônimo. */
  buscarPorTelefone(tenantId: string, telefone: string): Promise<FidelidadeCliente | null>
  listarPorTenant(tenantId: string): Promise<FidelidadeCliente[]>
  /**
   * Consulta pública (sem login) via RPC consultar_pontos_fidelidade — o
   * cliente final se identifica só pelo telefone, sem senha/cadastro. Nunca
   * lista todos os clientes do tenant, só resolve um telefone exato por vez.
   */
  consultarPontosPublico(tenantId: string, telefone: string): Promise<FidelidadeCliente | null>
}
