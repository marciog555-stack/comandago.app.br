import type { Categoria } from '#/domain/categoria/categoria'

export interface CategoriaRepository {
  /** Cardápio público — RLS já filtra por tenant ativo. */
  listarPublicasPorTenant(tenantId: string): Promise<Categoria[]>
  /** Uso no painel do lojista — RLS já filtra por membro do tenant. */
  listarPorTenant(tenantId: string): Promise<Categoria[]>
}
