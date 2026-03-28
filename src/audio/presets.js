import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

const sbClient = createClient(SUPABASE_URL, SUPABASE_KEY)

let cloudPresetsCache = {}

export async function loadAllPresets() {
  const presets = []

  // Cloud presets from Supabase
  try {
    const { data, error } = await sbClient
      .from('presets')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name')

    if (!error && data && data.length > 0) {
      cloudPresetsCache = {}
      data.forEach(p => {
        cloudPresetsCache[p.name] = { grid: p.grid, steps: p.steps, bpm: p.bpm, gains: p.gains }
        presets.push({
          key: 'cloud_' + p.name,
          label: (p.is_featured ? '⭐ ' : '☁ ') + p.name,
          source: 'cloud'
        })
      })
    }
  } catch {
    // Supabase no disponible — solo presets locales
  }

  // Local presets from localStorage
  Object.keys(localStorage)
    .filter(k => k.startsWith('ogbon_'))
    .forEach(k => {
      presets.push({
        key: k,
        label: k.replace('ogbon_', ''),
        source: 'local'
      })
    })

  return presets
}

export function getPresetData(key) {
  if (key.startsWith('cloud_')) return cloudPresetsCache[key.replace('cloud_', '')]
  return JSON.parse(localStorage.getItem(key))
}

export function saveLocalPreset(name, data) {
  localStorage.setItem('ogbon_' + name, JSON.stringify(data))
}

export function deleteLocalPreset(key) {
  if (key.startsWith('cloud_')) return false
  localStorage.removeItem(key)
  return true
}

export function exportPreset(name, data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
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
