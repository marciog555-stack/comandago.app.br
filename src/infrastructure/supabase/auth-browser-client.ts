import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '#/infrastructure/supabase/database.types'
import { supabaseAnonKey, supabaseUrl } from '#/infrastructure/supabase/env'

/**
 * Cliente do painel do lojista — sessão sincronizada via cookies (lidas
 * automaticamente via document.cookie, sem cookies customizadas aqui) em vez
 * de localStorage, pra bater com a sessão que o servidor vê (SSR/loaders).
 * O cardápio público continua usando o client anônimo puro (client.ts), sem
 * nenhuma dependência de sessão.
 */
export const supabaseAuth = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
