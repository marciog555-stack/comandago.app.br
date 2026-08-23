/**
 * Slugs reservados para o próprio produto — nunca disponíveis para uma loja.
 * TEM que ficar em sincronia com a CHECK constraint `tenants_slug_nao_reservado`
 * em supabase/migrations/20260823200000_schema_multitenant_rls.sql.
 */
export const RESERVED_SLUGS = [
  'app',
  'www',
  'api',
  'admin',
  'painel',
  'mail',
  'blog',
  'static',
  'assets',
  'cdn',
] as const

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase())
}
