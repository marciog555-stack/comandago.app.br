import { supabase } from '#/infrastructure/supabase/client'
import type { FidelidadeConsultaRepository } from '#/application/fidelidade/fidelidade-consulta-repository'

export const fidelidadeConsultaRepository: FidelidadeConsultaRepository = {
  async consultarPontos(tenantId, telefone) {
    const { data, error } = await supabase.rpc('consultar_pontos_fidelidade', {
      p_tenant_id: tenantId,
      p_telefone: telefone,
    })
    if (error) throw error
    return data
  },
}
