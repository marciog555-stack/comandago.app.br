import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'

import { entrarFn } from '#/infrastructure/supabase/auth-actions'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      const resultado = await entrarFn({ data: { email, senha } })
      if (!resultado.sucesso) {
        setErro(resultado.erro)
        return
      }
      // A sessão já está nos cookies (setados pela server function) —
      // invalida os loaders pra re-resolver a sessão e trocar de tela.
      await router.invalidate()
    } catch {
      setErro('Não foi possível entrar. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="text-2xl font-bold">ComandaGO — Painel</h1>
      <p className="mt-1 text-sm text-neutral-600">Entre com o e-mail e senha da sua loja.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </div>

        {erro ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
