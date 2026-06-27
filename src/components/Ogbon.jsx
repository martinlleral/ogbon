import { useState, useEffect, useRef, useCallback } from 'react'
import { createAudioEngine } from '../audio/engine'
import { useWakeLock } from '../hooks/useWakeLock'
import { loadAllPresets, getPresetData, getPresetMeta, getDefaultPreset, deriveGridShape, saveLocalPreset, deleteLocalPreset, exportPreset, importPreset } from '../audio/presets'
import CircleCanvas from './CircleCanvas'
import WaveCanvas from './WaveCanvas'

const INSTRUMENTS = [
  { name: 'Gã', color: '#ffd700', radius: 200, type: 'metal', pan: 0, gain: 0.8 },
  { name: 'Rum', color: '#ff4500', radius: 160, type: 'drum', freq: 62, pan: -0.4, gain: 1.0 },
  { name: 'Rumpi', color: '#ff8c00', radius: 120, type: 'drum', freq: 85, pan: 0.1, gain: 0.9 },
  { name: 'Lé', color: '#f0f0f0', radius: 80, type: 'drum', freq: 115, pan: 0.5, gain: 0.85 }
]

const MEASURES_OPTIONS = [
  { value: 1, label: '1 Compás' },
  { value: 2, label: '2 Compases' },
  { value: 3, label: '3 Compases' },
  { value: 4, label: '4 Compases' },
  { value: 8, label: '8 Compases' }
]

const DEFAULT_PRESET = getDefaultPreset()

export default function Ogbon() {
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(DEFAULT_PRESET.bpm)
  const [gridType, setGridType] = useState(DEFAULT_PRESET.gridType)
  const [measures, setMeasures] = useState(DEFAULT_PRESET.measures)
  const [steps, setSteps] = useState(() => DEFAULT_PRESET.steps.map(r => [...r]))
  const [gains, setGains] = useState(() => [...DEFAULT_PRESET.gains])
  const [showNeon, setShowNeon] = useState(true)
  const [showBeams, setShowBeams] = useState(true)
  const [showGlow, setShowGlow] = useState(true)
  const [vizMode, setVizMode] = useState('parallel')
  const [presetList, setPresetList] = useState([])
  const [selectedPreset, setSelectedPreset] = useState('builtin_ijexa')
  const [presetMeta, setPresetMeta] = useState(() => getPresetMeta('builtin_ijexa'))
  const [measuresOptions, setMeasuresOptions] = useState(MEASURES_OPTIONS)

  const engineRef = useRef(null)
  const fileInputRef = useRef(null)

  // Mantener la pantalla encendida mientras suena un ritmo (no-op si no hay soporte)
  useWakeLock(playing)

  // Create engine once, con el toque por defecto (ijexá) ya cargado para no abrir mudo
  useEffect(() => {
    engineRef.current = createAudioEngine(INSTRUMENTS)
    engineRef.current.applyPreset({
      grid: DEFAULT_PRESET.grid,
      steps: DEFAULT_PRESET.steps.map(r => [...r]),
      bpm: DEFAULT_PRESET.bpm,
      gains: [...DEFAULT_PRESET.gains]
    })
    return () => engineRef.current?.destroy()
  }, [])

  // Sync steps to engine
  useEffect(() => {
    engineRef.current?.setSteps(steps)
  }, [steps])

  // Sync BPM to engine
  useEffect(() => {
    engineRef.current?.setBPM(bpm)
  }, [bpm])

  // Load presets on mount
  useEffect(() => {
    loadAllPresets().then(setPresetList)
  }, [])

  const grid = gridType * measures

  const handleTogglePlay = useCallback(() => {
    const nowPlaying = engineRef.current.togglePlay()
    setPlaying(nowPlaying)
  }, [])

  const handleGridTypeChange = useCallback((val) => {
    const newGridType = parseInt(val)
    setGridType(newGridType)
    const newGrid = newGridType * measures
    const newSteps = engineRef.current.setGrid(newGrid)
    setSteps(newSteps)
    setPlaying(false)
  }, [measures])

  const handleMeasuresChange = useCallback((val) => {
    const newMeasures = parseInt(val)
    setMeasures(newMeasures)
    const newGrid = gridType * newMeasures
    const newSteps = engineRef.current.setGrid(newGrid)
    setSteps(newSteps)
    setPlaying(false)
  }, [gridType])

  const handleStepToggle = useCallback((instIdx, stepIdx) => {
    setSteps(prev => {
      const next = prev.map(row => [...row])
      next[instIdx][stepIdx] = (next[instIdx][stepIdx] + 1) % 3
      if (instIdx === 0 && next[instIdx][stepIdx] === 2) next[instIdx][stepIdx] = 0
      return next
    })
  }, [])

  const handleGainChange = useCallback((idx, value) => {
    engineRef.current?.setGain(idx, value)
    setGains(prev => {
      const next = [...prev]
      next[idx] = value
      return next
    })
  }, [])

  const handlePresetChange = useCallback((key) => {
    setSelectedPreset(key)
    if (key === 'Cargar...') { setPresetMeta(null); return }
    const data = getPresetData(key)
    if (!data) return
    const result = engineRef.current.applyPreset(data)
    setSteps(result.steps)
    setBpm(result.bpm)
    setGains(result.gains)
    setPlaying(false)
    setPresetMeta(getPresetMeta(key))

    // Restaurar la grilla exacta con la que se guardó (formato v2) o derivarla
    const { gridType: gt, measures: m } = deriveGridShape({ ...data, grid: result.grid })
    setGridType(gt)
    setMeasures(m)
    if (!measuresOptions.find(o => o.value === m)) {
      setMeasuresOptions(prev => [...prev, { value: m, label: `${m} Compases` }])
    }
  }, [measuresOptions])

  const handleSave = useCallback(() => {
    const name = prompt('Nombre del ritmo:')
    if (!name) return
    saveLocalPreset(name, { gridType, measures, grid, steps, bpm, gains })
    loadAllPresets().then(setPresetList)
  }, [gridType, measures, grid, steps, bpm, gains])

  const handleDelete = useCallback(() => {
    if (selectedPreset === 'Cargar...') return
    if (selectedPreset.startsWith('builtin_')) {
      alert('Los toques incluidos (🥁) no se pueden borrar.')
      return
    }
    if (confirm(`¿Eliminar el preset "${selectedPreset.replace('ogbon_', '')}"?`)) {
      deleteLocalPreset(selectedPreset)
      loadAllPresets().then(setPresetList)
      setSelectedPreset('Cargar...')
      setPresetMeta(null)
    }
  }, [selectedPreset])

  const handleExport = useCallback(() => {
    let exportName = 'ritmo_nuevo'
    if (selectedPreset !== 'Cargar...') {
      exportName = selectedPreset.replace('builtin_', '').replace('ogbon_', '')
    } else {
      const name = prompt('Nombre para el archivo:', 'Mi Ritmo')
      if (!name) return
      exportName = name
    }
    exportPreset(exportName, { name: exportName, gridType, measures, grid, steps, bpm, gains })
  }, [selectedPreset, gridType, measures, grid, steps, bpm, gains])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const data = await importPreset(file)
    if (!data) return
    // Validar archivos externos: 4 instrumentos y grilla representable (múltiplo de 12 o 16)
    const total = data.grid || (Array.isArray(data.steps) && data.steps[0] ? data.steps[0].length : 0)
    if (!Array.isArray(data.steps) || data.steps.length !== 4 || (total % 12 !== 0 && total % 16 !== 0)) {
      alert('Archivo .ogbon inválido o incompatible.')
      e.target.value = ''
      return
    }
    const result = engineRef.current.applyPreset(data)
    setSteps(result.steps)
    setBpm(result.bpm)
    setGains(result.gains)
    setPlaying(false)
    setSelectedPreset('Cargar...')
    setPresetMeta(null)

    const { gridType: gt, measures: m } = deriveGridShape({ ...data, grid: result.grid })
    setGridType(gt)
    setMeasures(m)
    if (!measuresOptions.find(o => o.value === m)) {
      setMeasuresOptions(prev => [...prev, { value: m, label: `${m} Compases` }])
    }
    e.target.value = ''
  }, [measuresOptions])

  const btnClass = 'bg-[#333] text-white border border-[#555] px-4 py-2 rounded cursor-pointer transition-all duration-300 hover:bg-[var(--gold)] hover:text-black'
  const activeBtnClass = 'bg-[#e74c3c] text-white border border-[#555] px-4 py-2 rounded cursor-pointer transition-all duration-300 hover:bg-[var(--gold)] hover:text-black'
  const selectClass = 'bg-[#333] text-white border border-[#555] p-2 rounded'

  return (
    <div className="flex flex-col items-center w-full pb-28">
      <h1 className="text-[var(--gold)] mt-4 mb-1 font-light tracking-wider text-xl sm:text-2xl">OGBÓN DIÁSPORA</h1>
      <p className="text-xs opacity-60 mb-4 text-center max-w-md px-2">
        Círculos de Axé · secuenciador de ritmos de percusión de Candomblé.
        Tradición afrobrasileña viva, tratada con respeto.
      </p>

      {/* Patrón + presets */}
      <div className="w-full max-w-2xl bg-[#1e1e1e] rounded-xl p-3 mb-3 flex flex-col gap-2 shadow-lg">
        <div className="flex flex-wrap justify-center gap-2">
          <select className={selectClass} value={gridType} onChange={e => handleGridTypeChange(e.target.value)}>
            <option value={12}>Grilla: 12/8 (Ternaria)</option>
            <option value={16}>Grilla: 4/4 (Cuaternaria)</option>
          </select>
          <select className={selectClass} value={measures} onChange={e => handleMeasuresChange(e.target.value)}>
            {measuresOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap justify-center gap-2 items-center">
          <select className={`${selectClass} flex-1 min-w-0`} value={selectedPreset} onChange={e => handlePresetChange(e.target.value)}>
            <option>Cargar...</option>
            {presetList.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <button className={btnClass} onClick={handleSave}>Guardar</button>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs opacity-70 pt-1">
          <button className="hover:text-[var(--gold)] transition-colors" onClick={handleExport} title="Descargar este ritmo como archivo">Exportar</button>
          <button className="hover:text-[var(--gold)] transition-colors" onClick={() => fileInputRef.current?.click()} title="Cargar un ritmo desde un archivo">Importar</button>
          <button className="hover:text-[var(--gold)] transition-colors" onClick={handleDelete}>Eliminar</button>
          <input ref={fileInputRef} type="file" className="hidden" accept=".ogbon" onChange={handleImport} />
        </div>
      </div>

      {/* Contexto cultural del toque seleccionado */}
      {presetMeta && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 mb-3 w-full max-w-2xl text-sm">
          <div className="text-[var(--gold)] font-semibold mb-1">Orixá: {presetMeta.orixa}</div>
          <p className="opacity-90 leading-snug">{presetMeta.nota}</p>
          <p className="opacity-60 text-xs mt-2">Fuente: {presetMeta.fuente}</p>
          <p className="opacity-60 text-xs">Confianza: {presetMeta.confianza}</p>
          <p className="opacity-50 text-xs mt-1 italic">Aproximación didáctica, pendiente de validación comunitaria.</p>
        </div>
      )}

      {/* Círculo — protagonista */}
      <CircleCanvas
        engine={engineRef}
        instruments={INSTRUMENTS}
        steps={steps}
        grid={grid}
        showNeon={showNeon}
        showBeams={showBeams}
        showGlow={showGlow}
        onStepToggle={handleStepToggle}
      />

      {/* Efectos visuales */}
      <div className="w-full max-w-2xl bg-[#1e1e1e] p-2.5 rounded-xl flex flex-wrap justify-center gap-2 items-center my-3 text-xs">
        <button className={showNeon ? activeBtnClass : btnClass} onClick={() => setShowNeon(v => !v)}>
          Neón: {showNeon ? 'ON' : 'OFF'}
        </button>
        <button className={showBeams ? activeBtnClass : btnClass} onClick={() => setShowBeams(v => !v)}>
          Haces: {showBeams ? 'ON' : 'OFF'}
        </button>
        <button className={showGlow ? activeBtnClass : btnClass} onClick={() => setShowGlow(v => !v)}>
          Anillos: {showGlow ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Mixer */}
      <div className="w-full max-w-2xl bg-[#1e1e1e] p-4 rounded-xl flex justify-center gap-8 mb-3 shadow-lg border border-[#333] max-sm:gap-5">
        {INSTRUMENTS.map((inst, i) => (
          <div key={inst.name} className="flex flex-col items-center gap-3">
            <label className="text-[11px] uppercase tracking-widest font-bold" style={{ color: inst.color }}>{inst.name}</label>
            <input
              type="range"
              className="mixer-slider"
              min="0"
              max="1.5"
              step="0.01"
              value={gains[i]}
              onChange={e => handleGainChange(i, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>

      {/* Ondas */}
      <div className="flex flex-col gap-2.5 w-full items-center">
        <WaveCanvas
          engine={engineRef}
          instruments={INSTRUMENTS}
          steps={steps}
          vizMode={vizMode}
        />
        <button
          className={btnClass}
          onClick={() => setVizMode(v => v === 'parallel' ? 'master' : 'parallel')}
        >
          Modo: {vizMode === 'parallel' ? 'Ondas Paralelas' : 'Onda Transcendental'}
        </button>
      </div>

      {/* Transporte fijo abajo — PLAY + BPM siempre a mano */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e1e]/95 backdrop-blur border-t border-[#444] shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleTogglePlay}
            aria-label={playing ? 'Detener' : 'Reproducir'}
            className={`flex items-center justify-center rounded-full w-14 h-14 shrink-0 text-xl font-bold transition-transform duration-200 hover:scale-105 ${playing ? 'bg-[#e74c3c] text-white' : 'bg-[var(--gold)] text-black'}`}
          >
            {playing ? '■' : '▶'}
          </button>
          <input
            type="range"
            min="10"
            max="180"
            value={bpm}
            onChange={e => setBpm(parseInt(e.target.value))}
            className="flex-1 accent-[var(--gold)]"
            aria-label="Tempo (BPM)"
          />
          <span className="text-sm tabular-nums w-16 text-right shrink-0">{bpm} BPM</span>
        </div>
      </div>
    </div>
  )
}
