import type { ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'

import { sairFn } from '#/infrastructure/supabase/auth-actions'

interface AdminLayoutProps {
  email: string
  children: ReactNode
}

export function AdminLayout({ email, children }: AdminLayoutProps) {
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
            <p className="text-sm text-neutral-500">ComandaGO — Admin</p>
            <p className="font-semibold">{email}</p>
          </div>
          <button type="button" onClick={handleSair} className="text-sm text-neutral-600 underline">
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  )
}
