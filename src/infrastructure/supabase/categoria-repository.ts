import { supabase } from '#/infrastructure/supabase/client'
import type { Database } from '#/infrastructure/supabase/database.types'
import type { Categoria } from '#/domain/categoria/categoria'
import type { CategoriaRepository } from '#/application/categoria/categoria-repository'

type LinhaCategoria = Database['public']['Tables']['categorias']['Row']

function mapear(linha: LinhaCategoria): Categoria {
  return {
    id: linha.id,
    tenantId: linha.tenant_id,
    nome: linha.nome,
    ordem: linha.ordem,
    ativo: linha.ativo,
  }
}

export const categoriaRepository: CategoriaRepository = {
  async listarPublicasPorTenant(tenantId) {
    // RLS (categorias_select_publico) já garante tenant ativo; "ativo" aqui
    // é o toggle da categoria em si (lojista esconde sem apagar), que a
    // policy não filtra sozinha.
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
    if (error) throw error
    return data.map(mapear)
  },

  async listarPorTenant(tenantId) {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ordem', { ascending: true })
    if (error) throw error
    return data.map(mapear)
  },
}
