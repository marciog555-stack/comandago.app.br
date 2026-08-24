/**
 * Consulta pública (sem login) de pontos de fidelidade — separado de
 * FidelidadeRepository (leitura/escrita autenticada, painel do lojista,
 * ainda sem implementação/UI) porque usa o client anônimo, igual ao
 * cardápio público.
 */
export interface FidelidadeConsultaRepository {
  /**
   * Via RPC consultar_pontos_fidelidade. `null` = tenant inativo/inexistente
   * ou telefone inválido; `0` cobre tanto "sem pontos" quanto "telefone não
   * encontrado" — indistinguíveis de propósito, pra não revelar se o
   * telefone existe na base.
   */
  consultarPontos(tenantId: string, telefone: string): Promise<number | null>
}
