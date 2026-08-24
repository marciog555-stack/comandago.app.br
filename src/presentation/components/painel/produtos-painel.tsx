import { useEffect, useState } from 'react'

import type { Categoria } from '#/domain/categoria/categoria'
import type { Produto } from '#/domain/produto/produto'
import type { CategoriaRepositoryPainel } from '#/application/categoria/categoria-repository-painel'
import type { DadosProduto, ProdutoRepositoryPainel } from '#/application/produto/produto-repository-painel'
import { subirImagem } from '#/infrastructure/supabase/storage-lojas'
import { formatarPreco } from '#/presentation/lib/formatar-preco'

interface ProdutosPainelProps {
  tenantId: string
  repositorio: ProdutoRepositoryPainel
  categoriaRepositorio: CategoriaRepositoryPainel
}

export function ProdutosPainel({ tenantId, repositorio, categoriaRepositorio }: ProdutosPainelProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    Promise.all([repositorio.listarPorTenant(tenantId), categoriaRepositorio.listarPorTenant(tenantId)])
      .then(([listaProdutos, listaCategorias]) => {
        if (cancelado) return
        setProdutos(listaProdutos)
        setCategorias(listaCategorias)
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar os produtos.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantId, repositorio, categoriaRepositorio])

  async function handleCriar(dados: DadosProduto) {
    setErro(null)
    try {
      const novo = await repositorio.criar(tenantId, dados)
      setProdutos((atual) => [...atual, novo])
    } catch {
      setErro('Não foi possível criar o produto. Tente de novo.')
    }
  }

  async function handleAtualizar(produto: Produto, dados: DadosProduto) {
    setErro(null)
    try {
      const atualizado = await repositorio.atualizar(produto.id, dados)
      setProdutos((atual) => atual.map((p) => (p.id === produto.id ? atualizado : p)))
    } catch {
      setErro('Não foi possível salvar o produto. Tente de novo.')
    }
  }

  async function handleExcluir(produto: Produto) {
    setErro(null)
    try {
      await repositorio.excluir(produto.id)
      setProdutos((atual) => atual.filter((p) => p.id !== produto.id))
    } catch {
      setErro('Não foi possível excluir o produto. Tente de novo.')
    }
  }

  if (categorias.length === 0 && !carregando) {
    return (
      <div>
        <h1 className="text-xl font-bold">Produtos</h1>
        <p className="mt-2 text-neutral-600">
          Crie uma categoria primeiro (aba Categorias) — todo produto precisa pertencer a uma.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Produtos</h1>
      <p className="mt-1 text-sm text-neutral-600">Cadastre os itens do seu cardápio.</p>

      {!carregando ? (
        <FormNovoProduto tenantId={tenantId} categorias={categorias} produtos={produtos} onCriar={handleCriar} />
      ) : null}

      {erro ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}

      {carregando ? (
        <p className="mt-6 text-sm text-neutral-500">Carregando…</p>
      ) : (
        <ul className="mt-6 divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
          {produtos
            .slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((produto) => (
              <LinhaProduto
                key={produto.id}
                produto={produto}
                categorias={categorias}
                onAtualizar={(dados) => handleAtualizar(produto, dados)}
                onExcluir={() => handleExcluir(produto)}
              />
            ))}
          {produtos.length === 0 ? (
            <li className="px-4 py-6 text-sm text-neutral-500">Nenhum produto ainda.</li>
          ) : null}
        </ul>
      )}
    </div>
  )
}

interface FormNovoProdutoProps {
  tenantId: string
  categorias: Categoria[]
  produtos: Produto[]
  onCriar: (dados: DadosProduto) => void
}

function FormNovoProduto({ tenantId, categorias, produtos, onCriar }: FormNovoProdutoProps) {
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? '')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    const precoNumero = Number(preco.replace(',', '.'))
    if (!nome.trim() || !categoriaId || !Number.isFinite(precoNumero) || precoNumero < 0) return

    setEnviando(true)
    try {
      const imagemUrl = arquivo ? await subirImagem(tenantId, 'produtos', arquivo) : null
      const proximaOrdem = produtos.reduce((maior, p) => Math.max(maior, p.ordem), -1) + 1
      onCriar({
        categoriaId,
        nome: nome.trim(),
        descricao: null,
        preco: precoNumero,
        imagemUrl,
        ativo: true,
        ordem: proximaOrdem,
      })
      setNome('')
      setPreco('')
      setArquivo(null)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-black/10 bg-white p-3">
      <div className="flex-1 basis-40">
        <label className="block text-xs text-neutral-500">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/20 px-2 py-1.5"
        />
      </div>
      <div className="w-24">
        <label className="block text-xs text-neutral-500">Preço</label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/20 px-2 py-1.5"
        />
      </div>
      <div className="flex-1 basis-32">
        <label className="block text-xs text-neutral-500">Categoria</label>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/20 px-2 py-1.5"
        >
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Foto (opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="mt-1 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Adicionar'}
      </button>
    </form>
  )
}

interface LinhaProdutoProps {
  produto: Produto
  categorias: Categoria[]
  onAtualizar: (dados: DadosProduto) => void
  onExcluir: () => void
}

function LinhaProduto({ produto, categorias, onAtualizar, onExcluir }: LinhaProdutoProps) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(produto.nome)
  const [preco, setPreco] = useState(String(produto.preco))
  const [categoriaId, setCategoriaId] = useState(produto.categoriaId)
  const [enviando, setEnviando] = useState(false)

  if (editando) {
    return (
      <li className="flex flex-wrap items-center gap-2 px-4 py-3">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 basis-32 rounded-lg border border-black/20 px-2 py-1"
        />
        <input
          type="text"
          inputMode="decimal"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-20 rounded-lg border border-black/20 px-2 py-1"
        />
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="rounded-lg border border-black/20 px-2 py-1"
        >
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={enviando}
          onClick={async () => {
            const precoNumero = Number(preco.replace(',', '.'))
            if (!nome.trim() || !Number.isFinite(precoNumero) || precoNumero < 0) return
            setEnviando(true)
            try {
              onAtualizar({
                categoriaId,
                nome: nome.trim(),
                descricao: produto.descricao,
                preco: precoNumero,
                imagemUrl: produto.imagemUrl,
                ativo: produto.ativo,
                ordem: produto.ordem,
              })
              setEditando(false)
            } finally {
              setEnviando(false)
            }
          }}
          className="text-sm font-medium text-emerald-700"
        >
          Salvar
        </button>
        <button type="button" onClick={() => setEditando(false)} className="text-sm text-neutral-500">
          Cancelar
        </button>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {produto.imagemUrl ? (
        <img src={produto.imagemUrl} alt={produto.nome} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-lg bg-neutral-100" aria-hidden="true" />
      )}
      <input
        type="checkbox"
        checked={produto.ativo}
        onChange={(e) =>
          onAtualizar({
            categoriaId: produto.categoriaId,
            nome: produto.nome,
            descricao: produto.descricao,
            preco: produto.preco,
            imagemUrl: produto.imagemUrl,
            ativo: e.target.checked,
            ordem: produto.ordem,
          })
        }
      />
      <span className={`flex-1 ${produto.ativo ? '' : 'text-neutral-400 line-through'}`}>{produto.nome}</span>
      <span className="text-sm text-neutral-600">{formatarPreco(produto.preco)}</span>
      <span className="text-xs text-neutral-400">
        {categorias.find((c) => c.id === produto.categoriaId)?.nome ?? '—'}
      </span>
      <button type="button" onClick={() => setEditando(true)} className="text-sm text-neutral-600 underline">
        Editar
      </button>
      <button type="button" onClick={onExcluir} className="text-sm text-red-600 underline">
        Excluir
      </button>
    </li>
  )
}
