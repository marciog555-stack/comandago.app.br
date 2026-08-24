import { useEffect, useState } from 'react'

import type { HorarioDia, Horarios } from '#/domain/tenant/tenant'
import { calcularStatusLoja } from '#/domain/tenant/status-loja'
import type { TenantRepositoryPainel } from '#/application/tenant/tenant-repository-painel'

interface HorariosPainelProps {
  tenantId: string
  repositorio: TenantRepositoryPainel
}

const DIAS: Array<{ chave: keyof Horarios; label: string }> = [
  { chave: 'segunda', label: 'Segunda' },
  { chave: 'terca', label: 'Terça' },
  { chave: 'quarta', label: 'Quarta' },
  { chave: 'quinta', label: 'Quinta' },
  { chave: 'sexta', label: 'Sexta' },
  { chave: 'sabado', label: 'Sábado' },
  { chave: 'domingo', label: 'Domingo' },
]

const HORARIO_PADRAO: HorarioDia = { abre: '18:00', fecha: '23:00' }

export function HorariosPainel({ tenantId, repositorio }: HorariosPainelProps) {
  const [horarios, setHorarios] = useState<Horarios>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    let cancelado = false
    repositorio
      .buscarProprio(tenantId)
      .then((tenant) => {
        if (!cancelado) setHorarios(tenant.horarios)
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar os horários.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantId, repositorio])

  function handleAlterarDia(chave: keyof Horarios, dados: Partial<HorarioDia>) {
    setSalvo(false)
    setHorarios((atual) => ({
      ...atual,
      [chave]: { ...(atual[chave] ?? HORARIO_PADRAO), ...dados },
    }))
  }

  async function handleSalvar() {
    setErro(null)
    setSalvando(true)
    try {
      const atualizado = await repositorio.atualizarHorarios(tenantId, horarios)
      setHorarios(atualizado.horarios)
      setSalvo(true)
    } catch {
      setErro('Não foi possível salvar os horários. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const statusPreview = calcularStatusLoja(horarios)

  return (
    <div>
      <h1 className="text-xl font-bold">Horários de funcionamento</h1>

      {carregando ? (
        <p className="mt-4 text-sm text-neutral-500">Carregando…</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-neutral-600">
            Agora, com esses horários, sua loja apareceria como:{' '}
            <span
              className={
                statusPreview === 'aberto' ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'
              }
            >
              {statusPreview === 'aberto' ? 'Aberto' : 'Fechado'}
            </span>
          </p>

          <div className="mt-6 space-y-2 rounded-lg border border-black/10 bg-white p-4">
            {DIAS.map(({ chave, label }) => {
              const dia = horarios[chave] ?? { ...HORARIO_PADRAO, fechado: true }
              return (
                <div key={chave} className="flex items-center gap-3 py-1">
                  <span className="w-24 text-sm">{label}</span>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <input
                      type="checkbox"
                      checked={!dia.fechado}
                      onChange={(e) => handleAlterarDia(chave, { fechado: !e.target.checked })}
                    />
                    Aberto
                  </label>
                  <input
                    type="time"
                    value={dia.abre}
                    disabled={dia.fechado}
                    onChange={(e) => handleAlterarDia(chave, { abre: e.target.value })}
                    className="rounded-lg border border-black/20 px-2 py-1 text-sm disabled:opacity-40"
                  />
                  <span className="text-sm text-neutral-400">até</span>
                  <input
                    type="time"
                    value={dia.fecha}
                    disabled={dia.fechado}
                    onChange={(e) => handleAlterarDia(chave, { fecha: e.target.value })}
                    className="rounded-lg border border-black/20 px-2 py-1 text-sm disabled:opacity-40"
                  />
                </div>
              )
            })}
          </div>

          {erro ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}
          {salvo ? <p className="mt-4 text-sm text-emerald-700">Horários salvos.</p> : null}

          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Salvar horários'}
          </button>
        </>
      )}
    </div>
  )
}
