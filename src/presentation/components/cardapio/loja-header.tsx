import type { TenantPublico } from '#/domain/tenant/tenant'
import type { StatusLoja } from '#/domain/tenant/status-loja'

interface LojaHeaderProps {
  tenant: TenantPublico
  status: StatusLoja
}

export function LojaHeader({ tenant, status }: LojaHeaderProps) {
  return (
    <header className="border-b border-black/10 bg-[var(--cor-fundo)] px-4 py-6">
      <div className="mx-auto flex max-w-2xl items-center gap-4">
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={`Logo de ${tenant.nome}`}
            width={64}
            height={64}
            loading="eager"
            decoding="async"
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="min-w-0">
          {/* H1 com nome da loja + cidade (seção 5 do briefing, requisito de SEO) */}
          <h1 className="truncate text-2xl font-bold text-[var(--cor-primaria)]">
            {tenant.nome} — {tenant.cidade}, GO
          </h1>
          <p className="mt-1 text-sm">
            <span
              className={
                status === 'aberto'
                  ? 'inline-flex items-center gap-1 font-medium text-emerald-700'
                  : 'inline-flex items-center gap-1 font-medium text-red-700'
              }
            >
              <span
                aria-hidden="true"
                className={
                  status === 'aberto'
                    ? 'h-2 w-2 rounded-full bg-emerald-600'
                    : 'h-2 w-2 rounded-full bg-red-600'
                }
              />
              {status === 'aberto' ? 'Aberto agora' : 'Fechado no momento'}
            </span>
          </p>
          {tenant.endereco ? <p className="mt-1 truncate text-sm text-neutral-600">{tenant.endereco}</p> : null}
        </div>
      </div>
    </header>
  )
}
