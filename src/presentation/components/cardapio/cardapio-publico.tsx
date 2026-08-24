import type { TenantPublico } from '#/domain/tenant/tenant'
import type { StatusLoja } from '#/domain/tenant/status-loja'
import type { CategoriaComProdutos } from '#/application/cardapio/buscar-cardapio-publico'
import { LojaHeader } from '#/presentation/components/cardapio/loja-header'
import { CategoriaSecao } from '#/presentation/components/cardapio/categoria-secao'

interface CardapioPublicoProps {
  tenant: TenantPublico
  status: StatusLoja
  categorias: CategoriaComProdutos[]
}

export function CardapioPublico({ tenant, status, categorias }: CardapioPublicoProps) {
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
      <main className="mx-auto max-w-2xl px-4 pb-16">
        {categorias.length === 0 ? (
          <p className="mt-8 text-neutral-600">Cardápio ainda não cadastrado.</p>
        ) : (
          categorias.map((categoria) => <CategoriaSecao key={categoria.id} categoria={categoria} />)
        )}
      </main>
    </div>
  )
}
