import { useEffect, useState } from 'react'

import type { TenantRepositoryPainel } from '#/application/tenant/tenant-repository-painel'
import { subirImagem } from '#/infrastructure/supabase/storage-lojas'

interface AparenciaPainelProps {
  tenantId: string
  repositorio: TenantRepositoryPainel
}

const COR_PRIMARIA_PADRAO = '#111111'
const COR_FUNDO_PADRAO = '#ffffff'

export function AparenciaPainel({ tenantId, repositorio }: AparenciaPainelProps) {
  const [corPrimaria, setCorPrimaria] = useState(COR_PRIMARIA_PADRAO)
  const [corFundo, setCorFundo] = useState(COR_FUNDO_PADRAO)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    let cancelado = false
    repositorio
      .buscarProprio(tenantId)
      .then((tenant) => {
        if (cancelado) return
        setCorPrimaria(tenant.corPrimaria ?? COR_PRIMARIA_PADRAO)
        setCorFundo(tenant.corFundo ?? COR_FUNDO_PADRAO)
        setLogoUrl(tenant.logoUrl)
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar a aparência da loja.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantId, repositorio])

  async function handleLogoSelecionado(arquivo: File) {
    setErro(null)
    setEnviandoLogo(true)
    try {
      const url = await subirImagem(tenantId, 'logo', arquivo)
      setLogoUrl(url)
    } catch {
      setErro('Não foi possível enviar a logo. Tente de novo.')
    } finally {
      setEnviandoLogo(false)
    }
  }

  async function handleSalvar() {
    setErro(null)
    setSalvando(true)
    setSalvo(false)
    try {
      await repositorio.atualizarAparencia(tenantId, { corPrimaria, corFundo, logoUrl })
      setSalvo(true)
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Aparência</h1>
      <p className="mt-1 text-sm text-neutral-600">Cores e logo aplicados no cardápio público da sua loja.</p>

      {carregando ? (
        <p className="mt-4 text-sm text-neutral-500">Carregando…</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium" htmlFor="cor-primaria">
                  Cor primária
                </label>
                <input
                  id="cor-primaria"
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => {
                    setSalvo(false)
                    setCorPrimaria(e.target.value)
                  }}
                  className="mt-1 h-10 w-16 rounded border border-black/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="cor-fundo">
                  Cor de fundo
                </label>
                <input
                  id="cor-fundo"
                  type="color"
                  value={corFundo}
                  onChange={(e) => {
                    setSalvo(false)
                    setCorFundo(e.target.value)
                  }}
                  className="mt-1 h-10 w-16 rounded border border-black/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="logo">
                  Logo
                </label>
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  disabled={enviandoLogo}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    if (arquivo) void handleLogoSelecionado(arquivo)
                  }}
                  className="mt-1 text-sm"
                />
                {enviandoLogo ? <p className="mt-1 text-xs text-neutral-500">Enviando…</p> : null}
              </div>
            </div>

            <div
              style={{ '--cor-primaria': corPrimaria, '--cor-fundo': corFundo } as React.CSSProperties}
              className="w-64 rounded-xl border border-black/10 bg-[var(--cor-fundo)] p-4"
            >
              <p className="mb-2 text-xs font-medium text-neutral-400">Prévia</p>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo da loja" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-neutral-200" aria-hidden="true" />
                )}
                <p className="font-bold text-[var(--cor-primaria)]">Nome da loja</p>
              </div>
            </div>
          </div>

          {erro ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}
          {salvo ? <p className="mt-4 text-sm text-emerald-700">Aparência salva.</p> : null}

          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando || enviandoLogo}
            className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Salvar aparência'}
          </button>
        </>
      )}
    </div>
  )
}
