import { createFileRoute } from '@tanstack/react-router'

import { listarLojasAdminFn } from '#/infrastructure/supabase/admin-actions'
import { resolverSessaoAdminFn } from '#/infrastructure/supabase/sessao-admin'
import { AdminHome } from '#/presentation/components/admin/admin-home'
import { AdminLayout } from '#/presentation/components/admin/admin-layout'
import { LoginForm } from '#/presentation/components/painel/login-form'

export const Route = createFileRoute('/admin')({
  loader: async () => {
    const resolucao = await resolverSessaoAdminFn()
    const lojas = resolucao.tipo === 'ok' ? await listarLojasAdminFn() : []
    return { resolucao, lojas }
  },
  component: AdminPage,
})

function AdminPage() {
  const { resolucao, lojas } = Route.useLoaderData()

  if (resolucao.tipo === 'sem_login') {
    return <LoginForm titulo="ComandaGO — Admin" subtitulo="Entre com sua conta de administrador." />
  }

  if (resolucao.tipo === 'sem_permissao') {
    return (
      <div className="mx-auto mt-16 max-w-sm px-4 text-center">
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {resolucao.email} não tem permissão de administrador da plataforma.
        </p>
      </div>
    )
  }

  return (
    <AdminLayout email={resolucao.sessao.email}>
      <AdminHome lojasIniciais={lojas} />
    </AdminLayout>
  )
}
