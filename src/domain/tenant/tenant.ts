export interface HorarioDia {
  abre: string
  fecha: string
  fechado?: boolean
}

export type Horarios = Partial<
  Record<'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado', HorarioDia>
>

/** Registro completo — só visível para membros do próprio tenant (RLS). */
export interface Tenant {
  id: string
  slug: string
  customDomain: string | null
  nome: string
  cidade: string
  logoUrl: string | null
  corPrimaria: string | null
  corFundo: string | null
  whatsapp: string | null
  endereco: string | null
  horarios: Horarios
  taxaEntrega: number
  pedidoMinimo: number
  ativo: boolean
  plano: string
  criadoEm: string
}

/**
 * Colunas de vitrine — o que a function pública `tenants_publico()` expõe.
 * Nunca inclui "plano" nem qualquer outro campo não-público de Tenant.
 */
export type TenantPublico = Omit<Tenant, 'plano' | 'criadoEm'>
