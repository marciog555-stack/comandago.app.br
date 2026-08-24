import type { Horarios } from '#/domain/tenant/tenant'

export type StatusLoja = 'aberto' | 'fechado'

const DIAS_SEMANA_POR_WEEKDAY_EN: Record<string, keyof Horarios> = {
  Sunday: 'domingo',
  Monday: 'segunda',
  Tuesday: 'terca',
  Wednesday: 'quarta',
  Thursday: 'quinta',
  Friday: 'sexta',
  Saturday: 'sabado',
}

/**
 * Única praça do v1 (seção 1 do briefing: Anápolis-GO). Se o produto
 * expandir pra outro fuso, isso precisa virar campo do tenant.
 */
const FUSO_HORARIO = 'America/Sao_Paulo'

/**
 * Calcula se a loja está aberta agora, a partir do horário de
 * funcionamento configurado. Suporta horário que cruza a meia-noite
 * (ex: 18:00–02:00).
 */
export function calcularStatusLoja(horarios: Horarios, agora: Date = new Date()): StatusLoja {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_HORARIO,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(agora)

  const weekdayEn = partes.find((p) => p.type === 'weekday')?.value ?? ''
  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? '0')
  const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? '0')

  const diaSemana = DIAS_SEMANA_POR_WEEKDAY_EN[weekdayEn]
  const horarioHoje = diaSemana ? horarios[diaSemana] : undefined

  if (!horarioHoje || horarioHoje.fechado) return 'fechado'

  const minutosAgora = hora * 60 + minuto
  const minutosAbre = paraMinutos(horarioHoje.abre)
  const minutosFecha = paraMinutos(horarioHoje.fecha)

  if (minutosFecha > minutosAbre) {
    return minutosAgora >= minutosAbre && minutosAgora < minutosFecha ? 'aberto' : 'fechado'
  }
  // horário que cruza a meia-noite
  return minutosAgora >= minutosAbre || minutosAgora < minutosFecha ? 'aberto' : 'fechado'
}

function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
