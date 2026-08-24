import { supabase } from '#/infrastructure/supabase/client'
import type { Database } from '#/infrastructure/supabase/database.types'
import type { Produto } from '#/domain/produto/produto'
import type { ProdutoRepository } from '#/application/produto/produto-repository'

type LinhaProduto = Database['public']['Tables']['produtos']['Row']

function mapear(linha: LinhaProduto): Produto {
  return {
    id: linha.id,
    tenantId: linha.tenant_id,
    categoriaId: linha.categoria_id,
    nome: linha.nome,
    descricao: linha.descricao,
    preco: linha.preco,
    imagemUrl: linha.imagem_url,
    ativo: linha.ativo,
    ordem: linha.ordem,
  }
}

export const produtoRepository: ProdutoRepository = {
  async listarPublicosPorTenant(tenantId) {
    // RLS (produtos_select_publico) já garante tenant ativo; "ativo" aqui é
    // o toggle do produto em si, que a policy não filtra sozinha.
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
    if (error) throw error
    return data.map(mapear)
  },

  async listarPorTenant(tenantId) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ordem', { ascending: true })
    if (error) throw error
    return data.map(mapear)
  },
}
