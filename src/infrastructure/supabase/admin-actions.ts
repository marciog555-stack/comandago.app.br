import { createServerFn } from '@tanstack/react-start'

import { validarNovaLoja } from '#/domain/tenant/provisionar-loja'
import type { DadosNovaLoja } from '#/domain/tenant/provisionar-loja'
import { criarClienteServidor } from '#/infrastructure/supabase/server-client'
import { resolverSessaoAdminFn } from '#/infrastructure/supabase/sessao-admin'

export interface LojaAdmin {
  id: string
  slug: string
  nome: string
  cidade: string
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
      .select('id, slug, nome, cidade, ativo, criado_em')
      .order('criado_em', { ascending: false })
    if (error) throw error

    return data.map((linha) => ({
      id: linha.id,
      slug: linha.slug,
      nome: linha.nome,
      cidade: linha.cidade,
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
