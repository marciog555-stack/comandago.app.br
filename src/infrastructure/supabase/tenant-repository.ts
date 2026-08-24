import { supabase } from '#/infrastructure/supabase/client'
import type { Database } from '#/infrastructure/supabase/database.types'
import type { Horarios, Tenant, TenantPublico } from '#/domain/tenant/tenant'
import type { TenantRepository } from '#/application/tenant/tenant-repository'

type LinhaTenant = Database['public']['Tables']['tenants']['Row']

/**
 * Shape das colunas de vitrine, com nullability real (a coluna aceita null
 * no banco). O tipo gerado pra Functions.tenants_publico.Returns marca essas
 * colunas como não-nulas — limitação do gerador de tipos do Supabase pra
 * functions com RETURNS TABLE, não reflete o schema de verdade.
 */
interface LinhaVitrine {
  id: string
  slug: string
  custom_domain: string | null
  nome: string
  logo_url: string | null
  cor_primaria: string | null
  cor_fundo: string | null
  whatsapp: string | null
  endereco: string | null
  horarios: LinhaTenant['horarios']
  taxa_entrega: number
  pedido_minimo: number
  ativo: boolean
}

function mapearPublico(linha: LinhaVitrine): TenantPublico {
  return {
    id: linha.id,
    slug: linha.slug,
    customDomain: linha.custom_domain,
    nome: linha.nome,
    logoUrl: linha.logo_url,
    corPrimaria: linha.cor_primaria,
    corFundo: linha.cor_fundo,
    whatsapp: linha.whatsapp,
    endereco: linha.endereco,
    horarios: (linha.horarios ?? {}) as Horarios,
    taxaEntrega: linha.taxa_entrega,
    pedidoMinimo: linha.pedido_minimo,
    ativo: linha.ativo,
  }
}

function mapearCompleto(linha: LinhaTenant): Tenant {
  return {
    ...mapearPublico(linha),
    plano: linha.plano,
    criadoEm: linha.criado_em,
  }
}

export const tenantRepository: TenantRepository = {
  async buscarPublicoPorSlug(slug) {
    const { data, error } = await supabase.rpc('tenants_publico').eq('slug', slug).maybeSingle()
    if (error) throw error
    return data ? mapearPublico(data as LinhaVitrine) : null
  },

  async buscarPublicoPorCustomDomain(customDomain) {
    const { data, error } = await supabase
      .rpc('tenants_publico')
      .eq('custom_domain', customDomain)
      .maybeSingle()
    if (error) throw error
    return data ? mapearPublico(data as LinhaVitrine) : null
  },

  async buscarProprioPorId(id) {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapearCompleto(data) : null
  },
}
