import { resolverHostname } from '#/domain/tenant/resolver-hostname'
import type { TenantPublico } from '#/domain/tenant/tenant'
import type { TenantRepository } from '#/application/tenant/tenant-repository'

export type ContextoHost =
  | { modo: 'landing' }
  | { modo: 'painel' }
  | { modo: 'loja'; tenant: TenantPublico }
  | { modo: 'loja_nao_encontrada' }
  | { modo: 'dominio_custom'; tenant: TenantPublico }
  | { modo: 'nao_encontrado' }

/**
 * Middleware de hostname (seção 3 do briefing): lê o host, extrai
 * subdomínio OU casa com custom_domain, busca o tenant no Supabase.
 * A renderização em si (tema + cardápio) é responsabilidade das rotas —
 * aqui só resolvemos QUAL loja (se houver) corresponde a este host.
 */
export async function resolverContextoPorHost(
  hostHeader: string,
  apexDomain: string,
  tenantRepository: TenantRepository,
): Promise<ContextoHost> {
  const modoHost = resolverHostname(hostHeader, apexDomain)

  switch (modoHost.tipo) {
    case 'landing':
      return { modo: 'landing' }
    case 'painel':
      return { modo: 'painel' }
    case 'loja_invalida':
      return { modo: 'loja_nao_encontrada' }
    case 'loja': {
      const tenant = await tenantRepository.buscarPublicoPorSlug(modoHost.slug)
      return tenant ? { modo: 'loja', tenant } : { modo: 'loja_nao_encontrada' }
    }
    case 'dominio_custom': {
      const tenant = await tenantRepository.buscarPublicoPorCustomDomain(modoHost.dominio)
      return tenant ? { modo: 'dominio_custom', tenant } : { modo: 'nao_encontrado' }
    }
  }
}
