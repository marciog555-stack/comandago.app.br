import { supabaseAuth } from '#/infrastructure/supabase/auth-browser-client'
import type { Database } from '#/infrastructure/supabase/database.types'
import type { Produto } from '#/domain/produto/produto'
import type { ProdutoRepositoryPainel } from '#/application/produto/produto-repository-painel'

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

export const produtoRepositoryPainel: ProdutoRepositoryPainel = {
  async listarPorTenant(tenantId) {
    const { data, error } = await supabaseAuth
      .from('produtos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('ordem', { ascending: true })
    if (error) throw error
    return data.map(mapear)
  },

  async criar(tenantId, dados) {
    const { data, error } = await supabaseAuth
      .from('produtos')
      .insert({
        tenant_id: tenantId,
        categoria_id: dados.categoriaId,
        nome: dados.nome,
        descricao: dados.descricao,
        preco: dados.preco,
        imagem_url: dados.imagemUrl,
        ativo: dados.ativo,
        ordem: dados.ordem,
      })
      .select('*')
      .single()
    if (error) throw error
    return mapear(data)
  },

  async atualizar(id, dados) {
    const { data, error } = await supabaseAuth
      .from('produtos')
      .update({
        categoria_id: dados.categoriaId,
        nome: dados.nome,
        descricao: dados.descricao,
        preco: dados.preco,
        imagem_url: dados.imagemUrl,
        ativo: dados.ativo,
        ordem: dados.ordem,
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return mapear(data)
  },

  async excluir(id) {
    const { error } = await supabaseAuth.from('produtos').delete().eq('id', id)
    if (error) throw error
  },
}
