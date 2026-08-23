export type TipoPedido = 'entrega' | 'retirada'

export type StatusPedido = 'recebido' | 'em_preparo' | 'pronto' | 'em_entrega' | 'concluido' | 'cancelado'

export interface ItemPedido {
  produtoId: string
  nome: string
  precoUnitario: number
  quantidade: number
  observacao?: string
}

export interface Pedido {
  id: string
  tenantId: string
  /** Sequencial por tenant, atribuído pelo banco (trigger) — nunca pelo cliente. */
  numero: number
  clienteNome: string
  clienteTelefone: string
  itens: ItemPedido[]
  subtotal: number
  taxaEntrega: number
  total: number
  tipo: TipoPedido
  endereco: string | null
  observacao: string | null
  formaPagamento: string
  status: StatusPedido
  criadoEm: string
}
