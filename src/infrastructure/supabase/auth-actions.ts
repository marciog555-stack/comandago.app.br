import { createServerFn } from '@tanstack/react-start'

import { criarClienteAuthServidor } from '#/infrastructure/supabase/auth-server-client'

interface DadosLogin {
  email: string
  senha: string
}

export type ResultadoLogin = { sucesso: true } | { sucesso: false; erro: string }

/**
 * Server function: o signInWithPassword roda no servidor (nunca no browser)
 * e escreve a sessão direto nos cookies da resposta — evita expor a troca de
 * credenciais a uma chamada client-side e mantém a sessão em sincronia com o
 * que os loaders (SSR) enxergam.
 */
export const entrarFn = createServerFn({ method: 'POST' })
  .validator((dados: DadosLogin) => dados)
  .handler(async ({ data }): Promise<ResultadoLogin> => {
    const supabase = criarClienteAuthServidor()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    })

    if (error) {
      return { sucesso: false, erro: mensagemDeErro(error.message) }
    }
    return { sucesso: true }
  })

export const sairFn = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = criarClienteAuthServidor()
  await supabase.auth.signOut()
})

function mensagemDeErro(mensagemOriginal: string): string {
  if (mensagemOriginal.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  return 'Não foi possível entrar. Tente de novo em instantes.'
}
