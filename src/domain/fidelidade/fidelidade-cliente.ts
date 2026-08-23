/** Chave composta (tenantId, telefone) — sem senha, sem cadastro. */
export interface FidelidadeCliente {
  tenantId: string
  telefone: string
  nome: string | null
  pontos: number
  ultimoPedido: string | null
}
