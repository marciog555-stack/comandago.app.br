import type { ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'

import { sairFn } from '#/infrastructure/supabase/auth-actions'
import type { SessaoPainel } from '#/infrastructure/supabase/sessao-painel'

const LINKS = [
  { to: '/' as const, label: 'Início' },
  { to: '/categorias' as const, label: 'Categorias' },
  { to: '/produtos' as const, label: 'Produtos' },
  { to: '/horarios' as const, label: 'Horários' },
  { to: '/aparencia' as const, label: 'Aparência' },
]

interface PainelLayoutProps {
  sessao: SessaoPainel
  children: ReactNode
}

export function PainelLayout({ sessao, children }: PainelLayoutProps) {
  const router = useRouter()

  async function handleSair() {
    await sairFn()
    await router.invalidate()
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-black/10 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Painel</p>
            <p className="font-semibold">{sessao.tenantNome}</p>
          </div>
          <button type="button" onClick={handleSair} className="text-sm text-neutral-600 underline">
            Sair
          </button>
        </div>
        <nav className="mx-auto mt-3 flex max-w-4xl gap-4 text-sm">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-neutral-600 hover:text-neutral-900">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  )
}
