import { createClient } from '@supabase/supabase-js'

import type { Database } from '#/infrastructure/supabase/database.types'
import { supabaseAnonKey, supabaseUrl } from '#/infrastructure/supabase/env'

/**
 * Cliente com a chave anônima — respeita RLS integralmente. É o único
 * cliente Supabase seguro para uso no browser (rotas/componentes).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
