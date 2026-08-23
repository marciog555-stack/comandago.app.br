function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não definida.`)
  }
  return valor
}

/** Seguras para o bundle do cliente — só leitura pública (RLS decide o resto). */
export const supabaseUrl = obrigatoria('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
export const supabaseAnonKey = obrigatoria('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)
