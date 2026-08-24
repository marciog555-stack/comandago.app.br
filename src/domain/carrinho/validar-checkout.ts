import type { DadosCheckout } from '#/domain/carrinho/carrinho'
import { calcularSubtotalCarrinho, formatarMoeda } from '#/domain/carrinho/carrinho'
import type { ItemPedido } from '#/domain/pedido/pedido'

export interface ResultadoValidacaoCheckout {
  valido: boolean
  erros: string[]
}

/**
 * Validação de UX (feedback rápido antes de chamar o servidor). Não é a
 * defesa de verdade — quem garante os mesmos limites contra adulteração é
 * a function criar_pedido no banco (pedido mínimo, item ativo, etc.).
 */
export function validarCheckout(
  itens: ItemPedido[],
  dados: DadosCheckout,
  pedidoMinimo: number,
): ResultadoValidacaoCheckout {
  const erros: string[] = []

  if (itens.length === 0) {
    erros.push('Seu carrinho está vazio.')
  }

  if (dados.clienteNome.trim().length === 0) {
    erros.push('Informe seu nome.')
  }

  const telefoneDigitos = dados.clienteTelefone.replace(/\D/g, '')
  if (telefoneDigitos.length < 10 || telefoneDigitos.length > 13) {
    erros.push('Informe um telefone válido, com DDD.')
  }

  if (dados.tipo === 'entrega' && !dados.endereco?.trim()) {
    erros.push('Informe o endereço de entrega.')
  }

  if (dados.formaPagamento.trim().length === 0) {
    erros.push('Escolha a forma de pagamento.')
  }

  if (itens.length > 0) {
    const subtotal = calcularSubtotalCarrinho(itens)
    if (subtotal < pedidoMinimo) {
      erros.push(`Pedido mínimo de ${formatarMoeda(pedidoMinimo)}.`)
    }
  }

  return { valido: erros.length === 0, erros }
}
