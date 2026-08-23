import { createClient } from '@supabase/supabase-js'

import type { Database } from '#/infrastructure/supabase/database.types'
import { supabaseUrl } from '#/infrastructure/supabase/env'

/**
 * Cliente com a service role key — bypassa RLS por completo. Só pode rodar
 * no servidor (loaders/server functions), nunca em código que vai pro
 * bundle do browser: é assim que o futuro provisionamento (tela admin do
 * Márcio) cria tenants sem precisar de policy de INSERT pública.
 *
 * SUPABASE_SERVICE_ROLE_KEY não tem prefixo VITE_ de propósito — só
 * variáveis VITE_* são expostas ao bundle do cliente pelo Vite.
 */
export function criarClienteServidor() {
  if (typeof window !== 'undefined') {
    throw new Error('criarClienteServidor() não pode rodar no browser — a service role key bypassa RLS.')
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não definida.')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
