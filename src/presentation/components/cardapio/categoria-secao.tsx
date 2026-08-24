import type { CategoriaComProdutos } from '#/application/cardapio/buscar-cardapio-publico'
import { ProdutoCard } from '#/presentation/components/cardapio/produto-card'

interface CategoriaSecaoProps {
  categoria: CategoriaComProdutos
  quantidadesNoCarrinho: Record<string, number>
  onAdicionarProduto: (produto: CategoriaComProdutos['produtos'][number]) => void
}

export function CategoriaSecao({ categoria, quantidadesNoCarrinho, onAdicionarProduto }: CategoriaSecaoProps) {
  return (
    <section aria-labelledby={`categoria-${categoria.id}`} className="mt-8 first:mt-0">
      <h2 id={`categoria-${categoria.id}`} className="text-lg font-bold">
        {categoria.nome}
      </h2>
      <div className="mt-2">
        {categoria.produtos.map((produto) => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            quantidadeNoCarrinho={quantidadesNoCarrinho[produto.id] ?? 0}
            onAdicionar={() => onAdicionarProduto(produto)}
          />
        ))}
      </div>
    </section>
  )
}
