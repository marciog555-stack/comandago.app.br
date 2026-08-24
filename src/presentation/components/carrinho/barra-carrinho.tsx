import { formatarPreco } from '#/presentation/lib/formatar-preco'

interface BarraCarrinhoProps {
  quantidadeTotal: number
  subtotal: number
  onAbrir: () => void
}

export function BarraCarrinho({ quantidadeTotal, subtotal, onAbrir }: BarraCarrinhoProps) {
  if (quantidadeTotal === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
      <button
        type="button"
        onClick={onAbrir}
        className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-xl bg-[var(--cor-primaria)] px-5 py-3.5 text-white shadow-lg"
      >
        <span className="font-medium">
          {quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'} no carrinho
        </span>
        <span className="font-semibold">Ver carrinho · {formatarPreco(subtotal)}</span>
      </button>
    </div>
  )
}
