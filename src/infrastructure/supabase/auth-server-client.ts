import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'

import type { Database } from '#/infrastructure/supabase/database.types'
import { supabaseAnonKey, supabaseUrl } from '#/infrastructure/supabase/env'

/**
 * Cliente Supabase ligado à sessão de auth via cookies (não localStorage) —
 * só funciona dentro de um contexto de requisição (loader, server function).
 * As cookies NÃO são httpOnly de propósito: é o que permite o cliente do
 * browser (auth-browser-client.ts) ler/renovar a mesma sessão via
 * document.cookie, seguindo a convenção padrão do @supabase/ssr.
 */
export function criarClienteAuthServidor() {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options)
        }
      },
    },
  })
}
