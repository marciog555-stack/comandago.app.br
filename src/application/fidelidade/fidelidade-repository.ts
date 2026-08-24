import type { FidelidadeCliente } from '#/domain/fidelidade/fidelidade-cliente'

export interface FidelidadeRepository {
  /** Uso no painel do lojista — RLS já filtra por membro do tenant. Sem acesso anônimo. */
  buscarPorTelefone(tenantId: string, telefone: string): Promise<FidelidadeCliente | null>
  listarPorTenant(tenantId: string): Promise<FidelidadeCliente[]>
  /**
   * Consulta pública (sem login) via RPC consultar_pontos_fidelidade — o
   * cliente final se identifica só pelo telefone, sem senha/cadastro. Nunca
   * lista todos os clientes do tenant, só resolve um telefone exato por vez.
   *
   * Retorna só a quantidade de pontos (não nome/ultimo_pedido). `null`
   * significa tenant inativo/inexistente ou telefone em formato inválido;
   * `0` cobre tanto "cliente sem pontos" quanto "telefone não encontrado" —
   * indistinguíveis de propósito, pra não revelar se o telefone existe na
   * base. A RPC normaliza o telefone recebido (só dígitos) antes de
   * comparar — se o telefone gravado em fidelidade_clientes.telefone não
   * estiver nesse mesmo formato normalizado, a consulta não encontra o
   * cliente e cai no caso "0" (ver comentário na migration
   * 20260823220000_fidelidade_consulta_publica_v2.sql).
   */
  consultarPontosPublico(tenantId: string, telefone: string): Promise<number | null>
}
