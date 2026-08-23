export type PapelTenantUsuario = 'owner' | 'staff'

export interface TenantUsuario {
  tenantId: string
  userId: string
  role: PapelTenantUsuario
  criadoEm: string
}
