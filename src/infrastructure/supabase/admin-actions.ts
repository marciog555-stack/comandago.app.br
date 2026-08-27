import { createServerFn } from '@tanstack/react-start'

import { validarDadosLoja, validarNovaLoja } from '#/domain/tenant/provisionar-loja'
import type { DadosEditarLoja, DadosNovaLoja } from '#/domain/tenant/provisionar-loja'
import { criarClienteServidor } from '#/infrastructure/supabase/server-client'
import { resolverSessaoAdminFn } from '#/infrastructure/supabase/sessao-admin'

export interface LojaAdmin {
  id: string
  slug: string
  nome: string
  cidade: string
  whatsapp: string
  ativo: boolean
  criadoEm: string
}

async function exigirAdminServidor() {
  const resolucao = await resolverSessaoAdminFn()
  if (resolucao.tipo !== 'ok') {
    throw new Error('Acesso negado.')
  }
  return resolucao.sessao
}

/**
 * Lista todas as lojas (não passa pelo RLS de member — service_role) pra
 * tela de provisionamento mostrar o que já existe antes de criar outra.
 */
export const listarLojasAdminFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<LojaAdmin[]> => {
    await exigirAdminServidor()
    const supabase = criarClienteServidor()

    const { data, error } = await supabase
      .from('tenants')
      .select('id, slug, nome, cidade, whatsapp, ativo, criado_em')
      .order('criado_em', { ascending: false })
    if (error) throw error

    return data.map((linha) => ({
      id: linha.id,
      slug: linha.slug,
      nome: linha.nome,
      cidade: linha.cidade,
      whatsapp: linha.whatsapp ?? '',
      ativo: linha.ativo,
      criadoEm: linha.criado_em,
    }))
  },
)

export type ResultadoProvisionar =
  | { sucesso: true; tenantId: string; slug: string }
  | { sucesso: false; erro: string }

/**
 * Provisiona uma loja nova (seção 6.5 do briefing): cria o usuário de login
 * do dono, o tenant e o vínculo owner — os três atrás da service_role
 * (nenhuma dessas tabelas tem policy pública de INSERT, de propósito, ver
 * comentário na migration inicial).
 *
 * Sem transação cross-sistema possível (auth.admin é uma API HTTP separada
 * do Postgres, não participa da mesma transação que o insert em tenants) —
 * por isso o try/catch de compensação: se o insert do tenant falhar depois
 * do usuário já criado, apaga o usuário órfão em vez de deixar uma conta de
 * login sem loja associada.
 */
export const provisionarLojaFn = createServerFn({ method: 'POST' })
  .validator((dados: DadosNovaLoja) => dados)
  .handler(async ({ data }): Promise<ResultadoProvisionar> => {
    await exigirAdminServidor()

    const erroValidacao = validarNovaLoja(data)
    if (erroValidacao) {
      return { sucesso: false, erro: erroValidacao }
    }

    const slug = data.slug.trim().toLowerCase()
    const supabase = criarClienteServidor()

    const { data: usuarioCriado, error: erroUsuario } = await supabase.auth.admin.createUser({
      email: data.emailDono.trim(),
      password: data.senhaDono,
      email_confirm: true,
    })
    if (erroUsuario || !usuarioCriado.user) {
      const jaExiste = erroUsuario?.message.toLowerCase().includes('already been registered')
      return {
        sucesso: false,
        erro: jaExiste ? 'Já existe uma conta com esse e-mail.' : 'Não foi possível criar o login do dono.',
      }
    }

    const { data: tenantCriado, error: erroTenant } = await supabase
      .from('tenants')
      .insert({ nome: data.nome.trim(), slug, cidade: data.cidade.trim(), whatsapp: data.whatsapp.trim() })
      .select('id')
      .single()

    if (erroTenant || !tenantCriado) {
      await supabase.auth.admin.deleteUser(usuarioCriado.user.id)
      const slugDuplicado = erroTenant?.code === '23505'
      return {
        sucesso: false,
        erro: slugDuplicado ? `O subdomínio "${slug}" já está em uso.` : 'Não foi possível criar a loja.',
      }
    }

    const { error: erroVinculo } = await supabase
      .from('tenant_usuarios')
      .insert({ tenant_id: tenantCriado.id, user_id: usuarioCriado.user.id, role: 'owner' })

    if (erroVinculo) {
      await supabase.auth.admin.deleteUser(usuarioCriado.user.id)
      await supabase.from('tenants').delete().eq('id', tenantCriado.id)
      return { sucesso: false, erro: 'Não foi possível vincular o dono à loja.' }
    }

    return { sucesso: true, tenantId: tenantCriado.id, slug }
  })

export type ResultadoEditarLoja = { sucesso: true } | { sucesso: false; erro: string }

/**
 * Edita os dados básicos de uma loja já existente — nome, subdomínio,
 * cidade e WhatsApp. Não mexe no login do dono (troca de e-mail é um fluxo
 * de auth à parte, fora do escopo aqui). Mesmo motivo de usar service_role
 * das outras functions deste arquivo: sem policy pública de UPDATE em
 * tenants por slug/nome/etc pro admin da plataforma (só o próprio owner via
 * `tenants_update_owner`, e mesmo assim não pelo painel do lojista hoje).
 */
export const atualizarLojaAdminFn = createServerFn({ method: 'POST' })
  .validator((dados: DadosEditarLoja) => dados)
  .handler(async ({ data }): Promise<ResultadoEditarLoja> => {
    await exigirAdminServidor()

    const erroValidacao = validarDadosLoja(data)
    if (erroValidacao) {
      return { sucesso: false, erro: erroValidacao }
    }

    const supabase = criarClienteServidor()
    const { error } = await supabase
      .from('tenants')
      .update({
        nome: data.nome.trim(),
        slug: data.slug.trim().toLowerCase(),
        cidade: data.cidade.trim(),
        whatsapp: data.whatsapp.trim(),
      })
      .eq('id', data.tenantId)

    if (error) {
      const slugDuplicado = error.code === '23505'
      return {
        sucesso: false,
        erro: slugDuplicado ? `O subdomínio "${data.slug}" já está em uso.` : 'Não foi possível salvar a loja.',
      }
    }

    return { sucesso: true }
  })

/**
 * Ativa/desativa uma loja (ex: cliente parou de pagar) — `ativo` já é o
 * campo que a RLS pública de categorias/produtos/pedidos usa pra decidir se
 * o cardápio fica visível (`tenant_esta_ativo`), então isso já "desliga" a
 * loja pro público sem precisar apagar nada.
 */
export const alternarAtivoLojaAdminFn = createServerFn({ method: 'POST' })
  .validator((dados: { tenantId: string; ativo: boolean }) => dados)
  .handler(async ({ data }): Promise<ResultadoEditarLoja> => {
    await exigirAdminServidor()

    const supabase = criarClienteServidor()
    const { error } = await supabase.from('tenants').update({ ativo: data.ativo }).eq('id', data.tenantId)
    if (error) {
      return { sucesso: false, erro: 'Não foi possível atualizar o status da loja.' }
    }

    return { sucesso: true }
  })
