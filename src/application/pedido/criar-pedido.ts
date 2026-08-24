import type { DadosCheckout } from '#/domain/carrinho/carrinho'
import { validarCheckout } from '#/domain/carrinho/validar-checkout'
import type { ItemPedido, Pedido } from '#/domain/pedido/pedido'
import type { PedidoRepository } from '#/application/pedido/pedido-repository'

export class CheckoutInvalidoError extends Error {
  erros: string[]

  constructor(erros: string[]) {
    super(erros.join(' '))
    this.name = 'CheckoutInvalidoError'
    this.erros = erros
  }
}

/**
 * Orquestra o checkout: valida no cliente (feedback rápido) e então chama o
 * repositório, que manda só produtoId+quantidade por item — nunca preço. A
 * validação de verdade contra adulteração é a function criar_pedido no
 * banco; isto aqui é só para não incomodar o servidor com um pedido
 * obviamente incompleto.
 */
export async function criarPedido(
  tenantId: string,
  itens: ItemPedido[],
  dados: DadosCheckout,
  pedidoMinimo: number,
  pedidoRepository: PedidoRepository,
): Promise<Pedido> {
  const validacao = validarCheckout(itens, dados, pedidoMinimo)
  if (!validacao.valido) {
    throw new CheckoutInvalidoError(validacao.erros)
  }

  return pedidoRepository.criar({
    tenantId,
    clienteNome: dados.clienteNome.trim(),
    clienteTelefone: dados.clienteTelefone.trim(),
    itens: itens.map((item) => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      observacao: item.observacao,
    })),
    tipo: dados.tipo,
    endereco: dados.endereco?.trim(),
    observacao: dados.observacao?.trim(),
    formaPagamento: dados.formaPagamento,
  })
}
