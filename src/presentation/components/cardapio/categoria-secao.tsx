import type { CategoriaComProdutos } from '#/application/cardapio/buscar-cardapio-publico'
import { ProdutoCard } from '#/presentation/components/cardapio/produto-card'

export function CategoriaSecao({ categoria }: { categoria: CategoriaComProdutos }) {
  return (
    <section aria-labelledby={`categoria-${categoria.id}`} className="mt-8 first:mt-0">
      <h2 id={`categoria-${categoria.id}`} className="text-lg font-bold">
        {categoria.nome}
      </h2>
      <div className="mt-2">
        {categoria.produtos.map((produto) => (
          <ProdutoCard key={produto.id} produto={produto} />
        ))}
      </div>
    </section>
  )
}
