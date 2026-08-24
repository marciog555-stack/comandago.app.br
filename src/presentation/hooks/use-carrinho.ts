import { useCallback, useEffect, useState } from 'react'

import { calcularQuantidadeTotal, calcularSubtotalCarrinho } from '#/domain/carrinho/carrinho'
import type { ItemPedido } from '#/domain/pedido/pedido'

function chaveStorage(tenantId: string): string {
  return `comandago:carrinho:${tenantId}`
}

interface ProdutoParaAdicionar {
  id: string
  nome: string
  preco: number
}

/**
 * Carrinho fica só no localStorage — sem backend até o checkout (o cliente
 * não tem login). Cada subdomínio de loja já é uma origem separada, então
 * localStorage naturalmente isola o carrinho de uma loja do de outra; a
 * chave por tenantId é reforço, não a defesa principal.
 *
 * Hidrata do storage só depois do mount (useEffect), nunca no valor inicial
 * do useState — o SSR sempre renderiza carrinho vazio, e ler localStorage no
 * initializer causaria mismatch de hidratação do React entre servidor e
 * client.
 */
export function useCarrinho(tenantId: string) {
  const [itens, setItens] = useState<ItemPedido[]>([])
  const [hidratado, setHidratado] = useState(false)

  useEffect(() => {
    setHidratado(false)
    try {
      const bruto = window.localStorage.getItem(chaveStorage(tenantId))
      setItens(bruto ? (JSON.parse(bruto) as ItemPedido[]) : [])
    } catch {
      setItens([])
    } finally {
      setHidratado(true)
    }
  }, [tenantId])

  useEffect(() => {
    if (!hidratado) return
    try {
      window.localStorage.setItem(chaveStorage(tenantId), JSON.stringify(itens))
    } catch {
      // localStorage indisponível (modo privado etc.) — não é crítico persistir.
    }
  }, [tenantId, itens, hidratado])

  const adicionarItem = useCallback((produto: ProdutoParaAdicionar) => {
    setItens((atual) => {
      const existente = atual.find((item) => item.produtoId === produto.id)
      if (existente) {
        return atual.map((item) =>
          item.produtoId === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item,
        )
      }
      return [
        ...atual,
        { produtoId: produto.id, nome: produto.nome, precoUnitario: produto.preco, quantidade: 1 },
      ]
    })
  }, [])

  const alterarQuantidade = useCallback((produtoId: string, quantidade: number) => {
    setItens((atual) => {
      if (quantidade <= 0) return atual.filter((item) => item.produtoId !== produtoId)
      return atual.map((item) => (item.produtoId === produtoId ? { ...item, quantidade } : item))
    })
  }, [])

  const removerItem = useCallback((produtoId: string) => {
    setItens((atual) => atual.filter((item) => item.produtoId !== produtoId))
  }, [])

  const limpar = useCallback(() => setItens([]), [])

  return {
    itens,
    adicionarItem,
    alterarQuantidade,
    removerItem,
    limpar,
    quantidadeTotal: calcularQuantidadeTotal(itens),
    subtotal: calcularSubtotalCarrinho(itens),
  }
}
