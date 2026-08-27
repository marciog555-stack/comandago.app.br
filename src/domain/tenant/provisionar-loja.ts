import { isReservedSlug } from '#/domain/tenant/reserved-slugs'

/** Regra da CHECK constraint `tenants_slug_formato` (migration inicial) — precisa ficar em sincronia. */
const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

export interface DadosLoja {
  nome: string
  slug: string
  cidade: string
  whatsapp: string
}

export interface DadosNovaLoja extends DadosLoja {
  emailDono: string
  senhaDono: string
}

export interface DadosEditarLoja extends DadosLoja {
  tenantId: string
}

/**
 * Validação de formulário (feedback rápido pro Márcio) — não substitui as
 * CHECK constraints do banco, que continuam sendo a garantia de verdade.
 * Compartilhada entre criar e editar loja: os campos básicos (nome, slug,
 * cidade, whatsapp) são os mesmos nos dois casos.
 */
export function validarDadosLoja(dados: DadosLoja): string | null {
  if (!dados.nome.trim()) return 'Informe o nome da loja.'
  if (!dados.cidade.trim()) return 'Informe a cidade.'
  if (!dados.whatsapp.replace(/\D/g, '')) return 'Informe o WhatsApp da loja.'

  const slug = dados.slug.trim().toLowerCase()
  if (!SLUG_REGEX.test(slug)) {
    return 'Subdomínio inválido — use só letras minúsculas, números e hífen (sem começar/terminar com hífen).'
  }
  if (isReservedSlug(slug)) {
    return `"${slug}" é reservado pela plataforma — escolha outro subdomínio.`
  }

  return null
}

/** Senha mínima de 8: mesmo critério do Supabase Auth por padrão. */
export function validarNovaLoja(dados: DadosNovaLoja): string | null {
  const erroBase = validarDadosLoja(dados)
  if (erroBase) return erroBase
  if (!dados.emailDono.trim()) return 'Informe o e-mail do dono.'
  if (dados.senhaDono.length < 8) return 'A senha do dono precisa ter pelo menos 8 caracteres.'
  return null
}

export function gerarUrlLoja(slug: string, apexDomain: string): string {
  return `https://${slug}.${apexDomain}`
}
