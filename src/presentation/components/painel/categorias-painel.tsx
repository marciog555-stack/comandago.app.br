import { useEffect, useState } from 'react'

import type { Categoria } from '#/domain/categoria/categoria'
import type { CategoriaRepositoryPainel } from '#/application/categoria/categoria-repository-painel'

interface CategoriasPainelProps {
  tenantId: string
  repositorio: CategoriaRepositoryPainel
}

export function CategoriasPainel({ tenantId, repositorio }: CategoriasPainelProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    // Busca client-side de propósito: o client auth-aware (cookies via
    // document.cookie) só funciona no browser. O painel é uma ferramenta
    // privada, sem requisito de SEO/SSR como o cardápio público.
    let cancelado = false
    repositorio
      .listarPorTenant(tenantId)
      .then((dados) => {
        if (!cancelado) setCategorias(dados)
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar as categorias.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantId, repositorio])

  async function handleAdicionar(nome: string) {
    setErro(null)
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) {
      setErro('Informe o nome da categoria.')
      return
    }
    try {
      const proximaOrdem = categorias.reduce((maior, c) => Math.max(maior, c.ordem), -1) + 1
      const nova = await repositorio.criar(tenantId, { nome: nomeLimpo, ordem: proximaOrdem, ativo: true })
      setCategorias((atual) => [...atual, nova])
    } catch {
      setErro('Não foi possível criar a categoria. Tente de novo.')
    }
  }

  async function handleAtualizar(categoria: Categoria, dados: { nome: string; ordem: number; ativo: boolean }) {
    setErro(null)
    if (!dados.nome.trim()) {
      setErro('O nome não pode ficar vazio.')
      return
    }
    try {
      const atualizada = await repositorio.atualizar(categoria.id, { ...dados, nome: dados.nome.trim() })
      setCategorias((atual) => atual.map((c) => (c.id === categoria.id ? atualizada : c)))
    } catch {
      setErro('Não foi possível salvar a categoria. Tente de novo.')
    }
  }

  async function handleExcluir(categoria: Categoria) {
    setErro(null)
    try {
      await repositorio.excluir(categoria.id)
      setCategorias((atual) => atual.filter((c) => c.id !== categoria.id))
    } catch {
      setErro(
        'Não foi possível excluir — provavelmente ainda há produtos nessa categoria. Mova ou exclua os produtos primeiro.',
      )
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Categorias</h1>
      <p className="mt-1 text-sm text-neutral-600">Organize as seções do seu cardápio.</p>

      <FormNovaCategoria onAdicionar={handleAdicionar} />

      {erro ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}

      {carregando ? (
        <p className="mt-6 text-sm text-neutral-500">Carregando…</p>
      ) : (
        <ul className="mt-6 divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
          {categorias
            .slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((categoria) => (
              <LinhaCategoria
                key={categoria.id}
                categoria={categoria}
                onAtualizar={(dados) => handleAtualizar(categoria, dados)}
                onExcluir={() => handleExcluir(categoria)}
              />
            ))}
          {categorias.length === 0 ? (
            <li className="px-4 py-6 text-sm text-neutral-500">Nenhuma categoria ainda.</li>
          ) : null}
        </ul>
      )}
    </div>
  )
}

function FormNovaCategoria({ onAdicionar }: { onAdicionar: (nome: string) => void }) {
  const [nome, setNome] = useState('')

  function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    onAdicionar(nome)
    setNome('')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="text"
        placeholder="Nome da nova categoria"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="flex-1 rounded-lg border border-black/20 px-3 py-2"
      />
      <button type="submit" className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white">
        Adicionar
      </button>
    </form>
  )
}

interface LinhaCategoriaProps {
  categoria: Categoria
  onAtualizar: (dados: { nome: string; ordem: number; ativo: boolean }) => void
  onExcluir: () => void
}

function LinhaCategoria({ categoria, onAtualizar, onExcluir }: LinhaCategoriaProps) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(categoria.nome)
  const [ordem, setOrdem] = useState(categoria.ordem)

  if (editando) {
    return (
      <li className="flex items-center gap-2 px-4 py-3">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 rounded-lg border border-black/20 px-2 py-1"
        />
        <input
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(Number(e.target.value))}
          className="w-16 rounded-lg border border-black/20 px-2 py-1"
        />
        <button
          type="button"
          onClick={() => {
            onAtualizar({ nome, ordem, ativo: categoria.ativo })
            setEditando(false)
          }}
          className="text-sm font-medium text-emerald-700"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => {
            setNome(categoria.nome)
            setOrdem(categoria.ordem)
            setEditando(false)
          }}
          className="text-sm text-neutral-500"
        >
          Cancelar
        </button>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={categoria.ativo}
          onChange={(e) => onAtualizar({ nome: categoria.nome, ordem: categoria.ordem, ativo: e.target.checked })}
        />
        <span className="sr-only">Ativa</span>
      </label>
      <span className={`flex-1 ${categoria.ativo ? '' : 'text-neutral-400 line-through'}`}>{categoria.nome}</span>
      <span className="text-xs text-neutral-400">ordem {categoria.ordem}</span>
      <button type="button" onClick={() => setEditando(true)} className="text-sm text-neutral-600 underline">
        Editar
      </button>
      <button type="button" onClick={onExcluir} className="text-sm text-red-600 underline">
        Excluir
      </button>
    </li>
  )
}
