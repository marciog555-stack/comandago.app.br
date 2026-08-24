import { isReservedSlug } from '#/domain/tenant/reserved-slugs'

/**
 * Classificação pura do host (sem I/O) — mapa de hosts da seção 3 do
 * briefing: apex = landing, app.<apex> = painel, {slug}.<apex> = loja,
 * qualquer outro host = candidato a custom_domain.
 */
export type ModoHost =
  | { tipo: 'landing' }
  | { tipo: 'painel' }
  | { tipo: 'loja'; slug: string }
  /** subdomínio vazio, aninhado (a.b.<apex>) ou reservado — nunca é uma loja válida. */
  | { tipo: 'loja_invalida' }
  | { tipo: 'dominio_custom'; dominio: string }

export function resolverHostname(hostHeader: string, apexDomain: string): ModoHost {
  const host = normalizarHost(hostHeader)
  const apex = normalizarHost(apexDomain)

  if (host === apex) return { tipo: 'landing' }
  if (host === `app.${apex}`) return { tipo: 'painel' }

  if (host.endsWith(`.${apex}`)) {
    const slug = host.slice(0, -(apex.length + 1))
    if (!slug || slug.includes('.') || isReservedSlug(slug)) {
      return { tipo: 'loja_invalida' }
    }
    return { tipo: 'loja', slug }
  }

  return { tipo: 'dominio_custom', dominio: host }
}

function normalizarHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0]!
}
