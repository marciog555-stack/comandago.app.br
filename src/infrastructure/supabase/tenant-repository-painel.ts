import { supabaseAuth } from '#/infrastructure/supabase/auth-browser-client'
import type { Database, Json } from '#/infrastructure/supabase/database.types'
import type { Horarios, Tenant } from '#/domain/tenant/tenant'
import type {
  DadosAparencia,
  TenantRepositoryPainel,
} from '#/application/tenant/tenant-repository-painel'

type LinhaTenant = Database['public']['Tables']['tenants']['Row']

function mapear(linha: LinhaTenant): Tenant {
  return {
    id: linha.id,
    slug: linha.slug,
    customDomain: linha.custom_domain,
    nome: linha.nome,
    cidade: linha.cidade,
    logoUrl: linha.logo_url,
    corPrimaria: linha.cor_primaria,
    corFundo: linha.cor_fundo,
    whatsapp: linha.whatsapp,
    endereco: linha.endereco,
    horarios: (linha.horarios ?? {}) as Horarios,
    taxaEntrega: linha.taxa_entrega,
    pedidoMinimo: linha.pedido_minimo,
    ativo: linha.ativo,
    plano: linha.plano,
    criadoEm: linha.criado_em,
  }
}

export const tenantRepositoryPainel: TenantRepositoryPainel = {
  async buscarProprio(tenantId) {
    const { data, error } = await supabaseAuth.from('tenants').select('*').eq('id', tenantId).single()
    if (error) throw error
    return mapear(data)
  },

  async atualizarHorarios(tenantId, horarios) {
    const { data, error } = await supabaseAuth
      .from('tenants')
      .update({ horarios: horarios as unknown as Json })
      .eq('id', tenantId)
      .select('*')
      .single()
    if (error) throw error
    return mapear(data)
  },

  async atualizarAparencia(tenantId, dados: DadosAparencia) {
    const { data, error } = await supabaseAuth
      .from('tenants')
      .update({ cor_primaria: dados.corPrimaria, cor_fundo: dados.corFundo, logo_url: dados.logoUrl })
      .eq('id', tenantId)
      .select('*')
      .single()
    if (error) throw error
    return mapear(data)
  },
}
