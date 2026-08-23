import type { Tenant, TenantPublico } from '#/domain/tenant/tenant'

export interface TenantRepository {
  /** Usa a function pública tenants_publico() — nunca a tabela base. */
  buscarPublicoPorSlug(slug: string): Promise<TenantPublico | null>
  buscarPublicoPorCustomDomain(customDomain: string): Promise<TenantPublico | null>
  /** Registro completo; só resolve se o usuário autenticado for membro do tenant (RLS). */
  buscarProprioPorId(id: string): Promise<Tenant | null>
}
