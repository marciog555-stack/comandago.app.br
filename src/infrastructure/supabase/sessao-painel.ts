import { createServerFn } from '@tanstack/react-start'

import { criarClienteAuthServidor } from '#/infrastructure/supabase/auth-server-client'

export interface SessaoPainel {
  usuarioId: string
  email: string
  tenantId: string
  tenantNome: string
  role: 'owner' | 'staff'
}

/**
 * Resolve a sessão do lojista logado + a que tenant ele pertence
 * (tenant_usuarios). Server function (não loader puro) porque precisa
 * funcionar tanto no SSR quanto em navegações client-side entre rotas do
 * painel — createServerFn cuida do RPC pro servidor nos dois casos.
 *
 * v1 assume um usuário pertence a um único tenant (onboarding presencial,
 * um dono por loja); pega a primeira linha se houver mais de uma.
 */
export const obterSessaoPainelFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessaoPainel | null> => {
    const supabase = criarClienteAuthServidor()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: vinculo } = await supabase
      .from('tenant_usuarios')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (!vinculo) return null

    const { data: tenant } = await supabase
      .from('tenants')
      .select('nome')
      .eq('id', vinculo.tenant_id)
      .maybeSingle()

    return {
      usuarioId: user.id,
      email: user.email ?? '',
      tenantId: vinculo.tenant_id,
      tenantNome: tenant?.nome ?? '',
      role: vinculo.role as 'owner' | 'staff',
    }
  },
)
