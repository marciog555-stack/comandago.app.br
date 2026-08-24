import type { Pedido, TipoPedido } from '#/domain/pedido/pedido'

/** O que vai pro banco por item — nunca preço, só o necessário para o banco recalcular. */
export interface ItemParaPedido {
  produtoId: string
  quantidade: number
  observacao?: string
}

export interface DadosNovoPedido {
  tenantId: string
  clienteNome: string
  clienteTelefone: string
  itens: ItemParaPedido[]
  tipo: TipoPedido
  endereco?: string
  observacao?: string
  formaPagamento: string
}

export interface PedidoRepository {
  /**
   * Cria o pedido via RPC criar_pedido (SECURITY DEFINER) — a única porta de
   * entrada, a tabela pedidos não tem mais policy de insert direto para
   * anon (migration 20260824130000_criar_pedido.sql). Preço/subtotal/taxa/
   * total são sempre recalculados no banco a partir do cardápio real; o que
   * este método manda nunca inclui preço.
   */
  criar(dados: DadosNovoPedido): Promise<Pedido>
  /** Uso no painel do lojista — RLS já filtra por membro do tenant. */
  listarPorTenant(tenantId: string): Promise<Pedido[]>
}
