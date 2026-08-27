import { createServerFn } from '@tanstack/react-start'

import { criarClienteAuthServidor } from '#/infrastructure/supabase/auth-server-client'

export interface SessaoAdmin {
  usuarioId: string
  email: string
}

export type ResolucaoSessaoAdmin =
  | { tipo: 'sem_login' }
  | { tipo: 'sem_permissao'; email: string }
  | { tipo: 'ok'; sessao: SessaoAdmin }

/**
 * Lista de e-mails com acesso à tela de provisionamento (só Márcio, seção 7
 * do briefing: "Márcio trabalha sozinho"). Allowlist por variável de
 * ambiente em vez de uma role/tabela nova: não existe conceito de "membro
 * da plataforma" no schema (tenant_usuarios é sobre pertencer a UM tenant) e
 * criar uma tabela só pra isso seria over-engineering para um único
 * operador. Comma-separated pra já contemplar um segundo admin no futuro
 * sem precisar mudar código.
 */
function emailsAdminPermitidos(): string[] {
  return (process.env.COMANDAGO_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Resolve a sessão de admin da plataforma — distinta de SessaoPainel (que
 * sempre resolve um tenant). Aqui não há tenant: é o usuário autenticado
 * cujo e-mail está na allowlist. Reaproveita o mesmo login/cookies do
 * painel (entrarFn/sairFn); só troca a checagem de tenant_usuarios pela
 * allowlist. Distingue "sem login" de "logado mas sem permissão" pra tela
 * dar um feedback certeiro (em vez de só mostrar o formulário de novo).
 */
export const resolverSessaoAdminFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ResolucaoSessaoAdmin> => {
    const supabase = criarClienteAuthServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return { tipo: 'sem_login' }

    const permitidos = emailsAdminPermitidos()
    if (permitidos.length === 0 || !permitidos.includes(user.email.toLowerCase())) {
      return { tipo: 'sem_permissao', email: user.email }
    }

    return { tipo: 'ok', sessao: { usuarioId: user.id, email: user.email } }
  },
)
