import { redirect } from '@tanstack/react-router'

import { obterSessaoPainelFn } from '#/infrastructure/supabase/sessao-painel'
import type { SessaoPainel } from '#/infrastructure/supabase/sessao-painel'

/**
 * Usado no loader de toda rota do painel (exceto "/", que trata a ausência
 * de sessão mostrando o login em vez de redirecionar). Redireciona pra "/"
 * quando não há sessão válida — o "/" então mostra o formulário de login.
 */
export async function exigirSessaoPainel(): Promise<SessaoPainel> {
  const sessao = await obterSessaoPainelFn()
  if (!sessao) {
    throw redirect({ to: '/' })
  }
  return sessao
}
