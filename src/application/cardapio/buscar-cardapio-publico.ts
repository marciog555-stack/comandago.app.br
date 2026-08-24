import type { Categoria } from '#/domain/categoria/categoria'
import type { Produto } from '#/domain/produto/produto'
import type { CategoriaRepository } from '#/application/categoria/categoria-repository'
import type { ProdutoRepository } from '#/application/produto/produto-repository'

export interface CategoriaComProdutos extends Categoria {
  produtos: Produto[]
}

/**
 * Cardápio público de um tenant: categorias ativas com seus produtos
 * ativos, agrupados e ordenados. Categoria sem nenhum produto ativo não
 * aparece (não faz sentido mostrar uma seção vazia pro cliente final).
 */
export async function buscarCardapioPublico(
  tenantId: string,
  categoriaRepository: CategoriaRepository,
  produtoRepository: ProdutoRepository,
): Promise<CategoriaComProdutos[]> {
  const [categorias, produtos] = await Promise.all([
    categoriaRepository.listarPublicasPorTenant(tenantId),
    produtoRepository.listarPublicosPorTenant(tenantId),
  ])

  return categorias
    .map((categoria) => ({
      ...categoria,
      produtos: produtos.filter((produto) => produto.categoriaId === categoria.id),
    }))
    .filter((categoria) => categoria.produtos.length > 0)
}
