import type { DadosCheckout } from '#/domain/carrinho/carrinho'
import { formatarMoeda } from '#/domain/carrinho/carrinho'
import type { ItemPedido } from '#/domain/pedido/pedido'

interface ParametrosMensagem {
  nomeLoja: string
  itens: ItemPedido[]
  dados: DadosCheckout
  subtotal: number
  taxaEntrega: number
  total: number
}

/** Mensagem de texto puro para abrir o WhatsApp da loja (briefing seção 6, item 2). */
export function gerarMensagemWhatsapp(params: ParametrosMensagem): string {
  const { nomeLoja, itens, dados, subtotal, taxaEntrega, total } = params

  const linhasItens = itens.map((item) => {
    const linha = `• ${item.quantidade}x ${item.nome} — ${formatarMoeda(item.precoUnitario * item.quantidade)}`
    return item.observacao?.trim() ? `${linha}\n   obs: ${item.observacao.trim()}` : linha
  })

  const linhas = [
    `Olá, ${nomeLoja}! Quero fazer um pedido:`,
    '',
    ...linhasItens,
    '',
    `Subtotal: ${formatarMoeda(subtotal)}`,
  ]

  if (dados.tipo === 'entrega') {
    linhas.push(`Taxa de entrega: ${formatarMoeda(taxaEntrega)}`)
  }

  linhas.push(`Total: ${formatarMoeda(total)}`, '')
  linhas.push(`Nome: ${dados.clienteNome}`)
  linhas.push(
    dados.tipo === 'entrega' ? `Entrega em: ${dados.endereco}` : 'Retirada no local',
  )
  linhas.push(`Pagamento: ${dados.formaPagamento}`)

  if (dados.observacao?.trim()) {
    linhas.push(`Observação: ${dados.observacao.trim()}`)
  }

  return linhas.join('\n')
}

/**
 * Link wa.me. Assume número brasileiro: se não vier com o "55" na frente
 * (DDI), prefixa — é o formato que o wa.me exige para abrir a conversa
 * direto, sem o usuário escolher o país no teclado numérico.
 */
export function gerarLinkWhatsapp(whatsapp: string, mensagem: string): string {
  const digitos = whatsapp.replace(/\D/g, '')
  const numero = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
