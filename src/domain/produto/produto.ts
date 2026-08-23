export interface Produto {
  id: string
  tenantId: string
  categoriaId: string
  nome: string
  descricao: string | null
  preco: number
  imagemUrl: string | null
  ativo: boolean
  ordem: number
}
