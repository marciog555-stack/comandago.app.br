import { useState } from 'react'

import { CheckoutInvalidoError, criarPedido } from '#/application/pedido/criar-pedido'
import type { DadosCheckout } from '#/domain/carrinho/carrinho'
import { calcularSubtotalCarrinho, calcularTotalCarrinho } from '#/domain/carrinho/carrinho'
import { gerarLinkWhatsapp, gerarMensagemWhatsapp } from '#/domain/carrinho/mensagem-whatsapp'
import type { ItemPedido, TipoPedido } from '#/domain/pedido/pedido'
import type { TenantPublico } from '#/domain/tenant/tenant'
import { pedidoRepository } from '#/infrastructure/supabase/pedido-repository'
import { formatarPreco } from '#/presentation/lib/formatar-preco'

interface CarrinhoCheckoutProps {
  tenant: TenantPublico
  itens: ItemPedido[]
  onAlterarQuantidade: (produtoId: string, quantidade: number) => void
  onRemoverItem: (produtoId: string) => void
  onLimpar: () => void
  onFechar: () => void
}

const FORMAS_PAGAMENTO = ['Dinheiro', 'Cartão na entrega', 'Pix']

export function CarrinhoCheckout({
  tenant,
  itens,
  onAlterarQuantidade,
  onRemoverItem,
  onLimpar,
  onFechar,
}: CarrinhoCheckoutProps) {
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [tipo, setTipo] = useState<TipoPedido>('entrega')
  const [endereco, setEndereco] = useState(tenant.endereco ?? '')
  const [formaPagamento, setFormaPagamento] = useState(FORMAS_PAGAMENTO[0]!)
  const [observacao, setObservacao] = useState('')
  const [erros, setErros] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)

  const subtotal = calcularSubtotalCarrinho(itens)
  const taxaEntrega = tipo === 'entrega' ? tenant.taxaEntrega : 0
  const total = calcularTotalCarrinho(subtotal, taxaEntrega)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()

    // Abre a aba em branco já dentro do clique (síncrono), antes de qualquer
    // await — é o que evita o bloqueio de popup do navegador. Só decidimos a
    // URL de verdade depois que o pedido é criado no banco.
    const janela = window.open('', '_blank')

    const dados: DadosCheckout = {
      clienteNome,
      clienteTelefone,
      tipo,
      endereco: tipo === 'entrega' ? endereco : undefined,
      observacao,
      formaPagamento,
    }

    setEnviando(true)
    setErros([])
    try {
      const pedido = await criarPedido(tenant.id, itens, dados, tenant.pedidoMinimo, pedidoRepository)

      const mensagem = gerarMensagemWhatsapp({
        nomeLoja: tenant.nome,
        itens: pedido.itens,
        dados,
        subtotal: pedido.subtotal,
        taxaEntrega: pedido.taxaEntrega,
        total: pedido.total,
      })
      const link = gerarLinkWhatsapp(tenant.whatsapp ?? '', mensagem)

      if (janela) {
        janela.location.href = link
      } else {
        window.open(link, '_blank')
      }

      onLimpar()
      onFechar()
    } catch (erro) {
      janela?.close()
      if (erro instanceof CheckoutInvalidoError) {
        setErros(erro.erros)
      } else {
        setErros([erro instanceof Error ? erro.message : 'Não foi possível enviar o pedido. Tente de novo.'])
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="text-lg font-bold">Seu pedido</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-2xl leading-none text-neutral-500">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {itens.length === 0 ? (
            <p className="text-neutral-600">Seu carrinho está vazio.</p>
          ) : (
            <ul className="space-y-3">
              {itens.map((item) => (
                <li key={item.produtoId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.nome}</p>
                    <p className="text-sm text-neutral-600">{formatarPreco(item.precoUnitario)} cada</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAlterarQuantidade(item.produtoId, item.quantidade - 1)}
                      aria-label={`Diminuir quantidade de ${item.nome}`}
                      className="h-7 w-7 rounded-full border border-black/20 text-sm"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm">{item.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => onAlterarQuantidade(item.produtoId, item.quantidade + 1)}
                      aria-label={`Aumentar quantidade de ${item.nome}`}
                      className="h-7 w-7 rounded-full border border-black/20 text-sm"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoverItem(item.produtoId)}
                      aria-label={`Remover ${item.nome}`}
                      className="ml-1 text-sm text-red-600"
                    >
                      remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {itens.length > 0 ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-black/10 pt-4">
              <div>
                <label className="block text-sm font-medium" htmlFor="cliente-nome">
                  Seu nome
                </label>
                <input
                  id="cliente-nome"
                  type="text"
                  required
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="cliente-telefone">
                  Seu telefone (com DDD)
                </label>
                <input
                  id="cliente-telefone"
                  type="tel"
                  required
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2"
                />
              </div>

              <fieldset>
                <legend className="text-sm font-medium">Como você quer receber</legend>
                <div className="mt-1 flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="tipo"
                      checked={tipo === 'entrega'}
                      onChange={() => setTipo('entrega')}
                    />
                    Entrega
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="tipo"
                      checked={tipo === 'retirada'}
                      onChange={() => setTipo('retirada')}
                    />
                    Retirada no local
                  </label>
                </div>
              </fieldset>

              {tipo === 'entrega' ? (
                <div>
                  <label className="block text-sm font-medium" htmlFor="endereco">
                    Endereço de entrega
                  </label>
                  <input
                    id="endereco"
                    type="text"
                    required
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium" htmlFor="forma-pagamento">
                  Forma de pagamento
                </label>
                <select
                  id="forma-pagamento"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2"
                >
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <option key={forma} value={forma}>
                      {forma}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="observacao">
                  Observação (opcional)
                </label>
                <textarea
                  id="observacao"
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2"
                />
              </div>

              <div className="space-y-1 border-t border-black/10 pt-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatarPreco(subtotal)}</span>
                </div>
                {tipo === 'entrega' ? (
                  <div className="flex justify-between">
                    <span>Taxa de entrega</span>
                    <span>{formatarPreco(taxaEntrega)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatarPreco(total)}</span>
                </div>
              </div>

              {erros.length > 0 ? (
                <ul className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erros.map((erro) => (
                    <li key={erro}>{erro}</li>
                  ))}
                </ul>
              ) : null}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-[var(--cor-primaria)] px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {enviando ? 'Enviando…' : 'Enviar pedido pelo WhatsApp'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
