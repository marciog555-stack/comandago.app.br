import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import type { TenantPublico } from '#/domain/tenant/tenant'
import type { FidelidadeConsultaRepository } from '#/application/fidelidade/fidelidade-consulta-repository'

interface ConsultaFidelidadeProps {
  tenant: TenantPublico
  repositorio: FidelidadeConsultaRepository
}

export function ConsultaFidelidade({ tenant, repositorio }: ConsultaFidelidadeProps) {
  const [telefone, setTelefone] = useState('')
  const [pontos, setPontos] = useState<number | null>(null)
  const [consultando, setConsultando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    setPontos(null)
    setConsultando(true)
    try {
      const resultado = await repositorio.consultarPontos(tenant.id, telefone)
      if (resultado === null) {
        setErro('Telefone inválido. Confira o número (com DDD) e tente de novo.')
        return
      }
      setPontos(resultado)
    } catch {
      setErro('Não foi possível consultar seus pontos agora. Tente de novo em instantes.')
    } finally {
      setConsultando(false)
    }
  }

  return (
    <div
      style={
        {
          '--cor-primaria': tenant.corPrimaria ?? '#111111',
          '--cor-fundo': tenant.corFundo ?? '#ffffff',
        } as React.CSSProperties
      }
      className="min-h-screen bg-[var(--cor-fundo)]"
    >
      <div className="mx-auto max-w-md px-4 py-10">
        <Link to="/" className="text-sm text-neutral-500 underline">
          ← Voltar ao cardápio
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-[var(--cor-primaria)]">Meus pontos em {tenant.nome}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          A cada pedido você ganha 1 ponto. Digite seu telefone (o mesmo usado nos pedidos) pra ver quantos você já
          tem.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <input
            type="tel"
            required
            placeholder="Seu telefone com DDD"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="flex-1 rounded-lg border border-black/20 px-3 py-2"
          />
          <button
            type="submit"
            disabled={consultando}
            className="rounded-lg bg-[var(--cor-primaria)] px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {consultando ? 'Buscando…' : 'Consultar'}
          </button>
        </form>

        {erro ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}

        {pontos !== null ? (
          <div className="mt-6 rounded-xl border border-black/10 bg-white p-6 text-center">
            <p className="text-sm text-neutral-500">Você tem</p>
            <p className="text-4xl font-bold text-[var(--cor-primaria)]">{pontos}</p>
            <p className="text-sm text-neutral-500">{pontos === 1 ? 'ponto' : 'pontos'} acumulados</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
