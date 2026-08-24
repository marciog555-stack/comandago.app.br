import { supabaseAuth } from '#/infrastructure/supabase/auth-browser-client'

/**
 * Sobe uma imagem pro bucket público "lojas", sob {tenantId}/{pasta}/... —
 * o primeiro segmento do path é o que a policy de Storage usa pra checar
 * is_tenant_member (migration 20260824140000_storage_lojas.sql). Retorna a
 * URL pública (bucket é público pra leitura).
 */
export async function subirImagem(tenantId: string, pasta: string, arquivo: File): Promise<string> {
  const extensao = arquivo.name.split('.').pop() ?? 'jpg'
  const caminho = `${tenantId}/${pasta}/${crypto.randomUUID()}.${extensao}`

  const { error } = await supabaseAuth.storage.from('lojas').upload(caminho, arquivo, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabaseAuth.storage.from('lojas').getPublicUrl(caminho)
  return data.publicUrl
}
