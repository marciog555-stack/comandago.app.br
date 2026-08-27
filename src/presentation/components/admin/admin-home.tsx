import { useState } from 'react'

import { validarDadosLoja, validarNovaLoja } from '#/domain/tenant/provisionar-loja'
import type { DadosLoja, DadosNovaLoja } from '#/domain/tenant/provisionar-loja'
import { gerarUrlLoja } from '#/domain/tenant/provisionar-loja'
import {
  alternarAtivoLojaAdminFn,
  atualizarLojaAdminFn,
  listarLojasAdminFn,
  provisionarLojaFn,
} from '#/infrastructure/supabase/admin-actions'
import type { LojaAdmin } from '#/infrastructure/supabase/admin-actions'

// Só um texto informativo (preview de URL) — o roteamento de verdade sempre
// usa COMANDAGO_APEX_DOMAIN no servidor. Mesmo fallback pra ficar coerente.
const APEX_DOMAIN_EXIBICAO = 'comandago.app.br'

interface AdminHomeProps {
  lojasIniciais: LojaAdmin[]
}

export function AdminHome({ lojasIniciais }: AdminHomeProps) {
  const [lojas, setLojas] = useState(lojasIniciais)
  const [sucesso, setSucesso] = useState<{ nome: string; url: string } | null>(null)

  async function recarregar() {
    setLojas(await listarLojasAdminFn())
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Lojas</h1>
      <p className="mt-1 text-sm text-neutral-600">Provisionar loja nova e acompanhar as que já existem.</p>

      {sucesso ? (
        <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Loja <strong>{sucesso.nome}</strong> criada — endereço:{' '}
          <a href={sucesso.url} target="_blank" rel="noreferrer" className="underline">
            {sucesso.url}
          </a>
        </div>
      ) : null}

      <FormNovaLoja
        onCriada={async (nome, slug) => {
          setSucesso({ nome, url: gerarUrlLoja(slug, APEX_DOMAIN_EXIBICAO) })
          await recarregar()
        }}
      />

      <h2 className="mt-10 text-lg font-semibold">Lojas cadastradas ({lojas.length})</h2>
      <ul className="mt-4 divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
        {lojas.map((loja) => (
          <LinhaLoja
            key={loja.id}
            loja={loja}
            onAtualizada={(atualizada) => {
              setLojas((atual) => atual.map((l) => (l.id === atualizada.id ? atualizada : l)))
            }}
          />
        ))}
        {lojas.length === 0 ? <li className="px-4 py-6 text-sm text-neutral-500">Nenhuma loja ainda.</li> : null}
      </ul>
    </div>
  )
}

function LinhaLoja({ loja, onAtualizada }: { loja: LojaAdmin; onAtualizada: (loja: LojaAdmin) => void }) {
  const [editando, setEditando] = useState(false)
  const [dados, setDados] = useState<DadosLoja>({
    nome: loja.nome,
    slug: loja.slug,
    cidade: loja.cidade,
    whatsapp: loja.whatsapp,
  })
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSalvar() {
    setErro(null)
    const erroValidacao = validarDadosLoja(dados)
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }
    setEnviando(true)
    try {
      const resultado = await atualizarLojaAdminFn({ data: { tenantId: loja.id, ...dados } })
      if (!resultado.sucesso) {
        setErro(resultado.erro)
        return
      }
      onAtualizada({
        ...loja,
        nome: dados.nome.trim(),
        slug: dados.slug.trim().toLowerCase(),
        cidade: dados.cidade.trim(),
        whatsapp: dados.whatsapp.trim(),
      })
      setEditando(false)
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleAlternarAtivo() {
    const novoAtivo = !loja.ativo
    try {
      const resultado = await alternarAtivoLojaAdminFn({ data: { tenantId: loja.id, ativo: novoAtivo } })
      if (resultado.sucesso) onAtualizada({ ...loja, ativo: novoAtivo })
    } catch {
      // silencioso — a lista recarrega o estado real da próxima vez que a página abrir.
    }
  }

  if (editando) {
    return (
      <li className="px-4 py-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={dados.nome}
            onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))}
            placeholder="Nome"
            className="rounded-lg border border-black/20 px-2 py-1"
          />
          <input
            value={dados.slug}
            onChange={(e) => setDados((d) => ({ ...d, slug: e.target.value.toLowerCase() }))}
            placeholder="Subdomínio"
            className="rounded-lg border border-black/20 px-2 py-1"
          />
          <input
            value={dados.cidade}
            onChange={(e) => setDados((d) => ({ ...d, cidade: e.target.value }))}
            placeholder="Cidade"
            className="rounded-lg border border-black/20 px-2 py-1"
          />
          <input
            value={dados.whatsapp}
            onChange={(e) => setDados((d) => ({ ...d, whatsapp: e.target.value }))}
            placeholder="WhatsApp"
            className="rounded-lg border border-black/20 px-2 py-1"
          />
        </div>
        {erro ? <p className="mt-2 text-sm text-red-700">{erro}</p> : null}
        <div className="mt-2 flex gap-3">
          <button type="button" disabled={enviando} onClick={handleSalvar} className="text-sm font-medium text-emerald-700">
            {enviando ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" onClick={() => setEditando(false)} className="text-sm text-neutral-500">
            Cancelar
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="font-medium">{loja.nome}</p>
        <p className="text-sm text-neutral-500">
          {loja.slug}.{APEX_DOMAIN_EXIBICAO} — {loja.cidade}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAlternarAtivo}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            loja.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          {loja.ativo ? 'Ativa' : 'Inativa'}
        </button>
        <button type="button" onClick={() => setEditando(true)} className="text-sm text-neutral-600 underline">
          Editar
        </button>
      </div>
    </li>
  )
}

const VAZIO: DadosNovaLoja = { nome: '', slug: '', cidade: 'Anápolis', whatsapp: '', emailDono: '', senhaDono: '' }

function FormNovaLoja({ onCriada }: { onCriada: (nome: string, slug: string) => void }) {
  const [dados, setDados] = useState<DadosNovaLoja>(VAZIO)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function atualizar<K extends keyof DadosNovaLoja>(campo: K, valor: DadosNovaLoja[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }

  function handleNomeChange(nome: string) {
    // Sugere o slug a partir do nome (Márcio pode editar antes de enviar) —
    // poupa digitação no cadastro presencial, que é o gargalo operacional
    // citado na seção 7 do briefing.
    setDados((atual) => ({
      ...atual,
      nome,
      slug: atual.slug === sugerirSlug(atual.nome) ? sugerirSlug(nome) : atual.slug,
    }))
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)

    const erroValidacao = validarNovaLoja(dados)
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    setEnviando(true)
    try {
      const resultado = await provisionarLojaFn({ data: dados })
      if (!resultado.sucesso) {
        setErro(resultado.erro)
        return
      }
      onCriada(dados.nome.trim(), resultado.slug)
      setDados(VAZIO)
    } catch {
      setErro('Não foi possível criar a loja. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-4 rounded-lg border border-black/10 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome da loja">
          <input
            type="text"
            required
            value={dados.nome}
            onChange={(e) => handleNomeChange(e.target.value)}
            className="w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </Campo>
        <Campo label="Subdomínio" ajuda={`${dados.slug || 'sualoja'}.${APEX_DOMAIN_EXIBICAO}`}>
          <input
            type="text"
            required
            value={dados.slug}
            onChange={(e) => atualizar('slug', e.target.value.toLowerCase())}
            className="w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </Campo>
        <Campo label="Cidade">
          <input
            type="text"
            required
            value={dados.cidade}
            onChange={(e) => atualizar('cidade', e.target.value)}
            className="w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </Campo>
        <Campo label="WhatsApp da loja">
          <input
            type="text"
            required
            placeholder="62999999999"
            value={dados.whatsapp}
            onChange={(e) => atualizar('whatsapp', e.target.value)}
            className="w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </Campo>
        <Campo label="E-mail do dono (login)">
          <input
            type="email"
            required
            value={dados.emailDono}
            onChange={(e) => atualizar('emailDono', e.target.value)}
            className="w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </Campo>
        <Campo label="Senha inicial do dono">
          <input
            type="text"
            required
            minLength={8}
            value={dados.senhaDono}
            onChange={(e) => atualizar('senhaDono', e.target.value)}
            className="w-full rounded-lg border border-black/20 px-3 py-2"
          />
        </Campo>
      </div>

      {erro ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Criando…' : 'Criar loja'}
      </button>
    </form>
  )
}

function Campo({ label, ajuda, children }: { label: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1 font-normal">{children}</div>
      {ajuda ? <p className="mt-1 text-xs font-normal text-neutral-500">{ajuda}</p> : null}
    </label>
  )
}

function sugerirSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (NFD separa a letra do diacrítico combinante)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}
