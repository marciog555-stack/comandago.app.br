import type { Produto } from '#/domain/produto/produto'
import { formatarPreco } from '#/presentation/lib/formatar-preco'

export function ProdutoCard({ produto }: { produto: Produto }) {
  return (
    <article className="flex gap-4 border-b border-black/5 py-4 last:border-0">
      {produto.imagemUrl ? (
        <img
          src={produto.imagemUrl}
          alt={produto.nome}
          width={80}
          height={80}
          loading="lazy"
          decoding="async"
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{produto.nome}</h3>
        {produto.descricao ? <p className="mt-0.5 text-sm text-neutral-600">{produto.descricao}</p> : null}
        <p className="mt-1 font-semibold text-[var(--cor-primaria)]">{formatarPreco(produto.preco)}</p>
      </div>
    </article>
  )
}
