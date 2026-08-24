import { supabase } from '#/infrastructure/supabase/client'
import type { Database } from '#/infrastructure/supabase/database.types'
import type { ItemPedido, Pedido, StatusPedido, TipoPedido } from '#/domain/pedido/pedido'
import type { PedidoRepository } from '#/application/pedido/pedido-repository'

type LinhaPedido = Database['public']['Tables']['pedidos']['Row']

function mapear(linha: LinhaPedido): Pedido {
  return {
    id: linha.id,
    tenantId: linha.tenant_id,
    numero: linha.numero,
    clienteNome: linha.cliente_nome,
    clienteTelefone: linha.cliente_telefone,
    // itens é jsonb no banco (formato controlado pelo próprio criar_pedido).
    itens: linha.itens as unknown as ItemPedido[],
    subtotal: linha.subtotal,
    taxaEntrega: linha.taxa_entrega,
    total: linha.total,
    tipo: linha.tipo as TipoPedido,
    endereco: linha.endereco,
    observacao: linha.observacao,
    formaPagamento: linha.forma_pagamento,
    status: linha.status as StatusPedido,
    criadoEm: linha.criado_em,
  }
}

export const pedidoRepository: PedidoRepository = {
  async criar(dados) {
    // p_endereco/p_observacao são colunas nullable no banco, mas o gerador
    // de tipos do Supabase marca parâmetros de function sempre como "string"
    // (mesma limitação documentada em tenant-repository.ts para colunas de
    // tenants_publico) — daí o cast, o runtime aceita null normalmente.
    const args = {
      p_tenant_id: dados.tenantId,
      p_cliente_nome: dados.clienteNome,
      p_cliente_telefone: dados.clienteTelefone,
      p_itens: dados.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        observacao: item.observacao ?? null,
      })),
      p_tipo: dados.tipo,
      p_endereco: dados.endereco ?? null,
      p_observacao: dados.observacao ?? null,
      p_forma_pagamento: dados.formaPagamento,
    } as unknown as Database['public']['Functions']['criar_pedido']['Args']

    const { data, error } = await supabase.rpc('criar_pedido', args)
    if (error) throw error
    return mapear(data as LinhaPedido)
  },

  async listarPorTenant(tenantId) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('criado_em', { ascending: false })
    if (error) throw error
    return data.map(mapear)
  },
}
