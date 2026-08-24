import type { Produto } from '#/domain/produto/produto'
import { formatarPreco } from '#/presentation/lib/formatar-preco'

interface ProdutoCardProps {
  produto: Produto
  quantidadeNoCarrinho: number
  onAdicionar: () => void
}

export function ProdutoCard({ produto, quantidadeNoCarrinho, onAdicionar }: ProdutoCardProps) {
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
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="font-semibold text-[var(--cor-primaria)]">{formatarPreco(produto.preco)}</p>
          <button
            type="button"
            onClick={onAdicionar}
            className="shrink-0 rounded-full bg-[var(--cor-primaria)] px-3 py-1.5 text-sm font-medium text-white"
          >
            {quantidadeNoCarrinho > 0 ? `${quantidadeNoCarrinho} no carrinho · +` : 'Adicionar'}
          </button>
        </div>
      </div>
    </article>
  )
}
