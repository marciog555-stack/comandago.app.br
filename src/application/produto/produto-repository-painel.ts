import type { Produto } from '#/domain/produto/produto'

export interface DadosProduto {
  categoriaId: string
  nome: string
  descricao: string | null
  preco: number
  imagemUrl: string | null
  ativo: boolean
  ordem: number
}

/**
 * Escrita de produtos no painel — mesmo padrão de CategoriaRepositoryPainel:
 * client auth-aware (cookies de sessão), separado do repositório de leitura
 * pública. RLS (produtos_insert/update/delete_membros) garante que só
 * membro do próprio tenant escreve, e a FK composta (categoria_id,
 * tenant_id) garante no banco que a categoria escolhida é do mesmo tenant.
 */
export interface ProdutoRepositoryPainel {
  listarPorTenant(tenantId: string): Promise<Produto[]>
  criar(tenantId: string, dados: DadosProduto): Promise<Produto>
  atualizar(id: string, dados: DadosProduto): Promise<Produto>
  excluir(id: string): Promise<void>
}
