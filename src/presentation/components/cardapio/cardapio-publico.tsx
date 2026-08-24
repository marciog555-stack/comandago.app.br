import { useState } from 'react'

import type { TenantPublico } from '#/domain/tenant/tenant'
import type { StatusLoja } from '#/domain/tenant/status-loja'
import type { CategoriaComProdutos } from '#/application/cardapio/buscar-cardapio-publico'
import { useCarrinho } from '#/presentation/hooks/use-carrinho'
import { LojaHeader } from '#/presentation/components/cardapio/loja-header'
import { CategoriaSecao } from '#/presentation/components/cardapio/categoria-secao'
import { BarraCarrinho } from '#/presentation/components/carrinho/barra-carrinho'
import { CarrinhoCheckout } from '#/presentation/components/carrinho/carrinho-checkout'

interface CardapioPublicoProps {
  tenant: TenantPublico
  status: StatusLoja
  categorias: CategoriaComProdutos[]
}

export function CardapioPublico({ tenant, status, categorias }: CardapioPublicoProps) {
  const carrinho = useCarrinho(tenant.id)
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)

  const quantidadesNoCarrinho = Object.fromEntries(
    carrinho.itens.map((item) => [item.produtoId, item.quantidade]),
  )

  return (
    <div
      style={
        {
          '--cor-primaria': tenant.corPrimaria ?? '#111111',
          '--cor-fundo': tenant.corFundo ?? '#ffffff',
        } as React.CSSProperties
      }
      className="min-h-screen bg-[var(--cor-fundo)]"
    >
      <LojaHeader tenant={tenant} status={status} />
      <main className="mx-auto max-w-2xl px-4 pb-24">
        {categorias.length === 0 ? (
          <p className="mt-8 text-neutral-600">Cardápio ainda não cadastrado.</p>
        ) : (
          categorias.map((categoria) => (
            <CategoriaSecao
              key={categoria.id}
              categoria={categoria}
              quantidadesNoCarrinho={quantidadesNoCarrinho}
              onAdicionarProduto={(produto) =>
                carrinho.adicionarItem({ id: produto.id, nome: produto.nome, preco: produto.preco })
              }
            />
          ))
        )}
      </main>

      <BarraCarrinho
        quantidadeTotal={carrinho.quantidadeTotal}
        subtotal={carrinho.subtotal}
        onAbrir={() => setCarrinhoAberto(true)}
      />

      {carrinhoAberto ? (
        <CarrinhoCheckout
          tenant={tenant}
          itens={carrinho.itens}
          onAlterarQuantidade={carrinho.alterarQuantidade}
          onRemoverItem={carrinho.removerItem}
          onLimpar={carrinho.limpar}
          onFechar={() => setCarrinhoAberto(false)}
        />
      ) : null}
    </div>
  )
}
