import type { Pedido } from '#/domain/pedido/pedido'

export interface NovoPedido {
  tenantId: string
  clienteNome: string
  clienteTelefone: string
  itens: Pedido['itens']
  subtotal: number
  taxaEntrega: number
  total: number
  tipo: Pedido['tipo']
  endereco?: string
  observacao?: string
  formaPagamento: string
}

export interface PedidoRepository {
  /** Insert anônimo — RLS só aceita se o tenant estiver ativo. numero é atribuído pelo banco. */
  criar(pedido: NovoPedido): Promise<Pedido>
  /** Uso no painel do lojista — RLS já filtra por membro do tenant. */
  listarPorTenant(tenantId: string): Promise<Pedido[]>
}
