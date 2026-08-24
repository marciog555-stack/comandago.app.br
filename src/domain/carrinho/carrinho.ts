import type { ItemPedido, TipoPedido } from '#/domain/pedido/pedido'

/**
 * Dados preenchidos pelo cliente na tela de checkout. Reflete só o que o
 * cliente digita — nunca preço (isso é recalculado no banco por
 * criar_pedido, nunca confiado a partir daqui).
 */
export interface DadosCheckout {
  clienteNome: string
  clienteTelefone: string
  tipo: TipoPedido
  endereco?: string
  observacao?: string
  formaPagamento: string
}

export function calcularSubtotalCarrinho(itens: ItemPedido[]): number {
  return itens.reduce((total, item) => total + item.precoUnitario * item.quantidade, 0)
}

export function calcularTotalCarrinho(subtotal: number, taxaEntrega: number): number {
  return subtotal + taxaEntrega
}

export function calcularQuantidadeTotal(itens: ItemPedido[]): number {
  return itens.reduce((total, item) => total + item.quantidade, 0)
}

/**
 * Domínio não depende de presentation/ (que tem seu próprio formatarPreco
 * com Intl pt-BR) — duplicado aqui, minúsculo, só para compor mensagens de
 * erro/WhatsApp sem inverter a camada.
 */
export function formatarMoeda(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}
