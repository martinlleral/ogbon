import { useState, useEffect, useRef, useCallback } from 'react'
import { createAudioEngine } from '../audio/engine'
import { loadAllPresets, getPresetData, saveLocalPreset, deleteLocalPreset, exportPreset, importPreset } from '../audio/presets'
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

export default function Ogbon() {
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(110)
  const [gridType, setGridType] = useState(12)
  const [measures, setMeasures] = useState(1)
  const [steps, setSteps] = useState(() => INSTRUMENTS.map(() => Array(12).fill(0)))
  const [gains, setGains] = useState(() => INSTRUMENTS.map(i => i.gain))
  const [showNeon, setShowNeon] = useState(true)
  const [showBeams, setShowBeams] = useState(true)
  const [showGlow, setShowGlow] = useState(true)
  const [vizMode, setVizMode] = useState('parallel')
  const [presetList, setPresetList] = useState([])
  const [selectedPreset, setSelectedPreset] = useState('Cargar...')
  const [measuresOptions, setMeasuresOptions] = useState(MEASURES_OPTIONS)

  const engineRef = useRef(null)
  const fileInputRef = useRef(null)

  // Create engine once
  useEffect(() => {
    engineRef.current = createAudioEngine(INSTRUMENTS)
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
    if (key === 'Cargar...') return
    const data = getPresetData(key)
    if (!data) return
    const result = engineRef.current.applyPreset(data)
    setSteps(result.steps)
    setBpm(result.bpm)
    setGains(result.gains)
    setPlaying(false)

    // Determine gridType and measures
    let baseGrid = 12, m = 1
    if (result.grid % 16 === 0) { baseGrid = 16; m = result.grid / 16 }
    else if (result.grid % 12 === 0) { baseGrid = 12; m = result.grid / 12 }
    setGridType(baseGrid)
    setMeasures(m)

    // Add measures option if not present
    if (!measuresOptions.find(o => o.value === m)) {
      setMeasuresOptions(prev => [...prev, { value: m, label: `${m} Compases` }])
    }
  }, [measuresOptions])

  const handleSave = useCallback(() => {
    const name = prompt('Nombre del ritmo (ej: Kabila, Ijexá):')
    if (!name) return
    saveLocalPreset(name, { grid, steps, bpm: String(bpm), gains })
    loadAllPresets().then(setPresetList)
  }, [grid, steps, bpm, gains])

  const handleDelete = useCallback(() => {
    if (selectedPreset === 'Cargar...') return
    if (selectedPreset.startsWith('internal_') || selectedPreset.startsWith('cloud_')) {
      alert('Los presets de la nube (⭐/☁) no se pueden borrar desde aquí.')
      return
    }
    if (confirm(`¿Eliminar el preset "${selectedPreset.replace('ogbon_', '')}"?`)) {
      deleteLocalPreset(selectedPreset)
      loadAllPresets().then(setPresetList)
      setSelectedPreset('Cargar...')
    }
  }, [selectedPreset])

  const handleExport = useCallback(() => {
    let exportName = 'ritmo_nuevo'
    if (selectedPreset !== 'Cargar...') {
      exportName = selectedPreset.replace('internal_', '').replace('ogbon_', '').replace('cloud_', '')
    } else {
      const name = prompt('Introduce un nombre para el archivo:', 'Mi Ritmo')
      if (!name) return
      exportName = name
    }
    exportPreset(exportName, { name: exportName, grid, steps, bpm: String(bpm), gains })
  }, [selectedPreset, grid, steps, bpm, gains])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const data = await importPreset(file)
    if (!data) return
    const result = engineRef.current.applyPreset(data)
    setSteps(result.steps)
    setBpm(result.bpm)
    setGains(result.gains)
    setPlaying(false)

    let baseGrid = 12, m = 1
    if (result.grid % 16 === 0) { baseGrid = 16; m = result.grid / 16 }
    else if (result.grid % 12 === 0) { baseGrid = 12; m = result.grid / 12 }
    setGridType(baseGrid)
    setMeasures(m)
    e.target.value = ''
  }, [])

  const btnClass = 'bg-[#333] text-white border border-[#555] px-4 py-2 rounded cursor-pointer transition-all duration-300 hover:bg-[var(--gold)] hover:text-black'
  const activeBtnClass = 'bg-[#e74c3c] text-white border border-[#555] px-4 py-2 rounded cursor-pointer transition-all duration-300 hover:bg-[var(--gold)] hover:text-black'
  const selectClass = 'bg-[#333] text-white border border-[#555] p-2 rounded'

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-[var(--gold)] my-5 font-light tracking-wider text-2xl">OGBÓN DIÁSPORA</h1>

      {/* Controls */}
      <div className="bg-[#1e1e1e] p-4 rounded-xl flex flex-wrap justify-center gap-4 items-center mb-5 w-full shadow-lg max-sm:p-2.5 max-sm:gap-2">
        <select className={selectClass} value={gridType} onChange={e => handleGridTypeChange(e.target.value)}>
          <option value={12}>Grilla: 12/8 (Ternaria)</option>
          <option value={16}>Grilla: 4/4 (Cuaternaria)</option>
        </select>
        <select className={selectClass} value={measures} onChange={e => handleMeasuresChange(e.target.value)}>
          {measuresOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button className={playing ? activeBtnClass : btnClass} onClick={handleTogglePlay}>
          {playing ? 'STOP' : 'PLAY'}
        </button>
        <input type="range" min="10" max="180" value={bpm} onChange={e => setBpm(parseInt(e.target.value))} />
        <span className="text-sm">{bpm} BPM</span>
        <button className={btnClass} onClick={handleSave}>Guardar Preset</button>
        <button className={btnClass} onClick={handleDelete}>Eliminar</button>
        <select className={selectClass} value={selectedPreset} onChange={e => handlePresetChange(e.target.value)}>
          <option>Cargar...</option>
          {presetList.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <button className={btnClass} onClick={handleExport} title="Descargar este ritmo como archivo">Exportar</button>
        <button className={btnClass} onClick={() => fileInputRef.current?.click()} title="Cargar un ritmo desde un archivo">Importar</button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".ogbon" onChange={handleImport} />
      </div>

      {/* Visual effects toggles */}
      <div className="bg-[#1e1e1e] p-2.5 rounded-xl flex flex-wrap justify-center gap-4 items-center mb-5 text-sm opacity-90 max-sm:gap-2">
        <button className={showNeon ? activeBtnClass : btnClass} onClick={() => setShowNeon(v => !v)}>
          Pulsos Neón: {showNeon ? 'ON' : 'OFF'}
        </button>
        <button className={showBeams ? activeBtnClass : btnClass} onClick={() => setShowBeams(v => !v)}>
          Haces de Luz: {showBeams ? 'ON' : 'OFF'}
        </button>
        <button className={showGlow ? activeBtnClass : btnClass} onClick={() => setShowGlow(v => !v)}>
          Anillos Brillantes: {showGlow ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Mixer */}
      <div className="bg-[#1e1e1e] p-5 rounded-xl flex flex-wrap justify-center gap-6 mb-8 shadow-lg border border-[#333] max-sm:gap-2.5 max-sm:p-3 max-sm:flex-nowrap max-sm:overflow-x-auto">
        {INSTRUMENTS.map((inst, i) => (
          <div key={inst.name} className="flex flex-col items-center gap-3 min-w-[70px] max-sm:min-w-[55px] max-sm:gap-2">
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

      {/* Circle Canvas */}
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

      {/* Wave Canvas */}
      <div className="flex flex-col gap-2.5 mt-2.5">
        <WaveCanvas
          engine={engineRef}
          instruments={INSTRUMENTS}
          steps={steps}
          vizMode={vizMode}
        />
        <div className="text-center">
          <button
            className={btnClass}
            onClick={() => setVizMode(v => v === 'parallel' ? 'master' : 'parallel')}
          >
            Modo: {vizMode === 'parallel' ? 'Ondas Paralelas' : 'Onda Transcendental'}
          </button>
        </div>
      </div>
    </div>
  )
}
