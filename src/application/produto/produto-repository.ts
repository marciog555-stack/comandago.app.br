import type { Produto } from '#/domain/produto/produto'

export interface ProdutoRepository {
  /** Cardápio público — RLS já filtra por tenant ativo. */
  listarPublicosPorTenant(tenantId: string): Promise<Produto[]>
  /** Uso no painel do lojista — RLS já filtra por membro do tenant. */
  listarPorTenant(tenantId: string): Promise<Produto[]>
}
