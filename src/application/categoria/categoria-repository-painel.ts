import type { Categoria } from '#/domain/categoria/categoria'

export interface DadosCategoria {
  nome: string
  ordem: number
  ativo: boolean
}

/**
 * Escrita de categorias no painel — separado de CategoriaRepository
 * (leitura pública + leitura autenticada) porque usa o client auth-aware
 * (cookies de sessão), nunca o anônimo. RLS (categorias_insert/update/
 * delete_membros) garante que só membro do próprio tenant escreve.
 */
export interface CategoriaRepositoryPainel {
  listarPorTenant(tenantId: string): Promise<Categoria[]>
  criar(tenantId: string, dados: DadosCategoria): Promise<Categoria>
  atualizar(id: string, dados: DadosCategoria): Promise<Categoria>
  excluir(id: string): Promise<void>
}
