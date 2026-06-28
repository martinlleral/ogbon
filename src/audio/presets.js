/**
 * OGBÓN — Gestión de presets
 * Sin backend: toques built-in (en código) + presets del usuario (localStorage)
 * + import/export de archivos `.ogbon`. 100% offline.
 *
 * Formato v2: cada preset guarda `gridType` (12 ó 16) y `measures` EXPLÍCITOS,
 * no solo el total de pasos. Esto evita el bug de fidelidad por el que un ritmo
 * 12/8 podía recargarse mal interpretado como 4/4 (ambos dan 48 pasos).
 *
 * ⚠️ Los patrones de atabaque (Rum/Rumpi/Lé) son reconstrucciones didácticas a
 * partir de descripciones etnomusicológicas, no transcripciones litúrgicas. El gã
 * (campana) tiene respaldo en notación publicada. Ver docs/VALIDACION-CULTURAL.md.
 */

const DEFAULT_GAINS = [0.8, 1.0, 0.9, 0.85]

// Orden de instrumentos: [Gã, Rum, Rumpi, Lé]. Valores: 0 silencio, 1 abierto, 2 cerrado.
export const BUILTIN_PRESETS = [
  {
    key: 'builtin_ijexa',
    name: 'Ijexá',
    label: '🪘 Ijexá — Oxum',
    gridType: 16,
    measures: 1,
    bpm: 100,
    gains: DEFAULT_GAINS,
    steps: [
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0], // Gã (campana, colapsada a golpes)
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], // Rum (líder, acentos abiertos)
      [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0], // Rumpi (sostén, unísono con Lé)
      [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0]  // Lé (sostén, unísono con Rumpi)
    ],
    meta: {
      orixa: 'Oxum',
      nota: 'Toque consagrado a Oxum, orixá de las aguas dulces, la fertilidad y la belleza. Cadencioso y fluido; de los terreiros pasó a la calle vía los afoxés (Filhos de Gandhy) y permeó la MPB.',
      fuente: 'Megna 2021 (George Mason Univ.); Redmond 2009 (Percussive Arts Society)',
      confianza: 'Grilla y metro: alta · Campana: media · Atabaques: aproximación didáctica'
    }
  },
  {
    key: 'builtin_aguere',
    name: 'Aguerê',
    label: '🪘 Aguerê — Oxóssi',
    gridType: 12,
    measures: 1,
    bpm: 110,
    gains: DEFAULT_GAINS,
    steps: [
      [1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0], // Gã (linha-guia "3-2" de Lühning)
      [1, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 0], // Rum (alterna abierto / slap)
      [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0], // Rumpi
      [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0]  // Lé
    ],
    meta: {
      orixa: 'Oxóssi (Odé)',
      nota: 'Toque por excelencia de Oxóssi, orixá cazador de los bosques. Ágil y propulsivo, "como la astucia del cazador"; facilita el trance en la danza.',
      fuente: 'Lühning 1990; Candemil 2017 (UDESC); Megna 2021 (GMU)',
      confianza: 'Metro y campana: alta · Atabaques: aproximación didáctica'
    }
  },
  {
    key: 'builtin_vassi',
    name: 'Vassi',
    label: '🪘 Vassi — linha-guia',
    gridType: 12,
    measures: 1,
    bpm: 140,
    gains: DEFAULT_GAINS,
    steps: [
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1], // Gã (clave 12/8 de Kubik)
      [1, 0, 0, 2, 0, 0, 1, 0, 2, 0, 0, 0], // Rum (improvisa)
      [1, 0, 2, 0, 0, 1, 0, 2, 0, 1, 0, 0], // Rumpi
      [1, 0, 2, 0, 0, 1, 0, 2, 0, 1, 0, 0]  // Lé
    ],
    meta: {
      orixa: 'Colectivo (no de un orixá único)',
      nota: 'La linha-guia más ubicua del candomblé ketu: el esqueleto rítmico colectivo sobre el que se construyen toques específicos (alujá de Xangô, agabi de Ogum).',
      fuente: 'Kubik 1979; Candemil 2017 (UDESC); Farias 2021 (Claves Afro-Brasileiras)',
      confianza: 'Metro y campana: alta · Atabaques: aproximación didáctica'
    }
  }
]

const LS_PREFIX = 'ogbon_'

// El ijexá es el preset bandera: se carga al abrir la app.
export function getDefaultPreset() {
  const p = BUILTIN_PRESETS[0]
  return {
    grid: p.gridType * p.measures,
    gridType: p.gridType,
    measures: p.measures,
    steps: p.steps.map(row => [...row]),
    bpm: p.bpm,
    gains: [...p.gains]
  }
}

export async function loadAllPresets() {
  const presets = BUILTIN_PRESETS.map(p => ({ key: p.key, label: p.label, source: 'builtin' }))

  // Presets del usuario (localStorage)
  Object.keys(localStorage)
    .filter(k => k.startsWith(LS_PREFIX))
    .forEach(k => {
      presets.push({ key: k, label: k.replace(LS_PREFIX, ''), source: 'local' })
    })

  return presets
}

// Deriva la forma de grilla de un preset. Usa gridType/measures explícitos (formato v2)
// y, solo para presets viejos sin esa info, cae a una heurística que prioriza 12
// (ternario, lo más común en Candomblé) sobre 16.
export function deriveGridShape(data) {
  if (data.gridType && data.measures) {
    return { gridType: data.gridType, measures: data.measures }
  }
  const total = data.grid || (data.steps && data.steps[0] ? data.steps[0].length : 12)
  if (total % 12 === 0) return { gridType: 12, measures: total / 12 }
  if (total % 16 === 0) return { gridType: 16, measures: total / 16 }
  return { gridType: 12, measures: 1 }
}

export function getPresetData(key) {
  if (key.startsWith('builtin_')) {
    const p = BUILTIN_PRESETS.find(b => b.key === key)
    if (!p) return null
    return {
      grid: p.gridType * p.measures,
      gridType: p.gridType,
      measures: p.measures,
      steps: p.steps.map(row => [...row]),
      bpm: p.bpm,
      gains: [...p.gains]
    }
  }
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

export function getPresetMeta(key) {
  if (key.startsWith('builtin_')) {
    const p = BUILTIN_PRESETS.find(b => b.key === key)
    return p ? p.meta : null
  }
  return null
}

export function saveLocalPreset(name, data) {
  // data: { gridType, measures, steps, bpm, gains }
  localStorage.setItem(LS_PREFIX + name, JSON.stringify(data))
}

export function deleteLocalPreset(key) {
  if (key.startsWith('builtin_')) return false
  localStorage.removeItem(key)
  return true
}

export function exportPreset(name, data) {
  const blob = new Blob([JSON.stringify({ ...data, name, format: 'ogbon-v2' })], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.ogbon`
  a.click()
  URL.revokeObjectURL(url)
}

export function importPreset(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
