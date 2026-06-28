/**
 * Lógica compartida de los golpes (single source of truth — evita drift entre el círculo,
 * la partitura, la grilla accesible y el handler de Ogbon).
 *
 * Valores de celda: 0 silencio · 1 abierto · 2 cerrado. El Gã (instrumento 0) sólo
 * alterna 0↔1 (nunca 2).
 */

export const GA_LABELS = ['silencio', 'golpe']
export const DRUM_LABELS = ['silencio', 'abierto', 'cerrado']

// Próximo valor al ciclar un golpe: 0→1→2→0; el Gã (i===0) sólo 0↔1.
export function nextStepValue(cur, instIdx) {
  let next = (cur + 1) % 3
  if (instIdx === 0 && next === 2) next = 0
  return next
}

// Palabra de estado para el lector de pantalla.
export function stateLabel(value, instIdx) {
  return (instIdx === 0 ? GA_LABELS : DRUM_LABELS)[value] ?? 'silencio'
}

// Lee una celda clampeando índices: un cambio de grilla nunca produce out-of-bounds.
export function readCell(steps, instIdx, step) {
  const row = steps[Math.min(instIdx, steps.length - 1)] || []
  return row[Math.min(step, row.length - 1)] ?? 0
}

// Escribe un golpe por VALOR, sin ciclar (a diferencia de nextStepValue, que alterna/borra):
// re-tapear una celda la reafirma en vez de apagarla — clave para grabar tocando (Modo Toque)
// sin ver. Gã (i===0) se clampa a 0/1. Devuelve un steps nuevo (inmutable).
export function writeHit(steps, instIdx, step, value) {
  const v = instIdx === 0 ? (value ? 1 : 0) : value
  const next = steps.map(row => [...row])
  next[instIdx][step] = v
  return next
}
