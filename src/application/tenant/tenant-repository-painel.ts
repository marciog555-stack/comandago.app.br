import type { Horarios, Tenant } from '#/domain/tenant/tenant'

export interface DadosAparencia {
  corPrimaria: string | null
  corFundo: string | null
  logoUrl: string | null
}

/**
 * Leitura/escrita do próprio tenant no painel — client auth-aware (cookies
 * de sessão). Separado de TenantRepository (leitura pública via
 * tenants_publico(), client anônimo) porque aqui é sempre "os dados
 * completos do MEU tenant", protegido por tenants_select_membros/
 * tenants_update_owner.
 */
export interface TenantRepositoryPainel {
  buscarProprio(tenantId: string): Promise<Tenant>
  atualizarHorarios(tenantId: string, horarios: Horarios): Promise<Tenant>
  atualizarAparencia(tenantId: string, dados: DadosAparencia): Promise<Tenant>
}
