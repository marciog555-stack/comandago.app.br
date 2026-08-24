import { supabaseAuth } from '#/infrastructure/supabase/auth-browser-client'
import type { Database } from '#/infrastructure/supabase/database.types'
import type { Categoria } from '#/domain/categoria/categoria'
import type { CategoriaRepositoryPainel } from '#/application/categoria/categoria-repository-painel'

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

export const categoriaRepositoryPainel: CategoriaRepositoryPainel = {
  async listarPorTenant(tenantId) {
    const { data, error } = await supabaseAuth
      .from('categorias')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ordem', { ascending: true })
    if (error) throw error
    return data.map(mapear)
  },

  async criar(tenantId, dados) {
    const { data, error } = await supabaseAuth
      .from('categorias')
      .insert({ tenant_id: tenantId, nome: dados.nome, ordem: dados.ordem, ativo: dados.ativo })
      .select('*')
      .single()
    if (error) throw error
    return mapear(data)
  },

  async atualizar(id, dados) {
    const { data, error } = await supabaseAuth
      .from('categorias')
      .update({ nome: dados.nome, ordem: dados.ordem, ativo: dados.ativo })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return mapear(data)
  },

  async excluir(id) {
    const { error } = await supabaseAuth.from('categorias').delete().eq('id', id)
    if (error) throw error
  },
}
