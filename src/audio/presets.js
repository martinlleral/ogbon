import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jsweznbutnkureqxeomz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd2V6bmJ1dG5rdXJlcXhlb216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzI0MDcsImV4cCI6MjA4OTE0ODQwN30.1a4yZ0ErZZR-RyAMNz7jIxH46JVs5GGFX7WsDQuImb0'

const sbClient = createClient(SUPABASE_URL, SUPABASE_KEY)

export const INTERNAL_PRESETS = {
  "Kabila (Base)": { grid: 12, steps: [[1,0,1,0,1,1,0,1,0,1,0,1],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[2,0,1,2,0,1,2,0,1,2,0,1]], bpm: "110", gains: [0.8,1,0.9,0.85] },
  "Ijexá": { grid: 12, steps: [[1,0,1,0,1,0,1,0,1,0,1,0],[0,0,2,0,1,0,0,0,2,0,1,0],[0,2,0,0,1,0,0,2,0,0,1,0],[2,0,0,0,1,0,2,0,0,0,1,0]], bpm: "105", gains: [0.7,1,0.9,0.8] }
}

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
    } else {
      addInternalPresets(presets)
    }
  } catch {
    addInternalPresets(presets)
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

function addInternalPresets(presets) {
  Object.keys(INTERNAL_PRESETS).forEach(name => {
    presets.push({
      key: 'internal_' + name,
      label: '⭐ ' + name,
      source: 'internal'
    })
  })
}

export function getPresetData(key) {
  if (key.startsWith('cloud_')) return cloudPresetsCache[key.replace('cloud_', '')]
  if (key.startsWith('internal_')) return INTERNAL_PRESETS[key.replace('internal_', '')]
  return JSON.parse(localStorage.getItem(key))
}

export function saveLocalPreset(name, data) {
  localStorage.setItem('ogbon_' + name, JSON.stringify(data))
}

export function deleteLocalPreset(key) {
  if (key.startsWith('internal_') || key.startsWith('cloud_')) return false
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
