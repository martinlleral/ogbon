import { useState, useEffect, useRef, useCallback } from 'react'
import { createAudioEngine } from '../audio/engine'
import { useWakeLock } from '../hooks/useWakeLock'
import { useModal } from '../hooks/useModal'
import { useToast } from '../hooks/useToast'
import { loadAllPresets, getPresetData, getPresetMeta, getDefaultPreset, deriveGridShape, saveLocalPreset, deleteLocalPreset, exportPreset, importPreset } from '../audio/presets'
import CircleCanvas from './CircleCanvas'
import AccessibleGrid from './AccessibleGrid'
import NotationCanvas from './NotationCanvas'
import WaveCanvas from './WaveCanvas'
import RecordBar from './RecordBar'
import { nextStepValue, writeHit } from '../audio/steps'
import Modal from './Modal'
import Toast from './Toast'
import Onboarding from './Onboarding'
import KeyboardHelp from './KeyboardHelp'
import CollapsiblePanel from './CollapsiblePanel'

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
  const [vizMode, setVizMode] = useState('bloom')
  const [practiceMode, setPracticeMode] = useState(true)
  const [metricGuide, setMetricGuide] = useState(false) // claqueta + clicks de posición métrica
  const [kbCursor, setKbCursor] = useState(null) // celda activa del teclado (la dibuja el círculo)
  // Modo Toque (tap-to-circle): grabar tocando, los golpes caen cuantizados en el anillo activo
  const [recordMode, setRecordMode] = useState(false)
  const [recInst, setRecInst] = useState(1)        // anillo destino (Rum por defecto)
  const [closedMode, setClosedMode] = useState(false) // los taps escriben cerrado (2) en vez de abierto (1)
  const [countingIn, setCountingIn] = useState(false) // un compás de claqueta antes de registrar
  const [recAnnounce, setRecAnnounce] = useState('')  // región aria-live propia de grabación
  const [presetList, setPresetList] = useState([])
  const [selectedPreset, setSelectedPreset] = useState('builtin_ijexa')
  const [presetMeta, setPresetMeta] = useState(() => getPresetMeta('builtin_ijexa'))
  const [measuresOptions, setMeasuresOptions] = useState(MEASURES_OPTIONS)

  const engineRef = useRef(null)
  const fileInputRef = useRef(null)
  // Refs del Modo Toque (valores que cambian sin re-render o que lee el listener global)
  const lastTapRef = useRef(0)            // dedupe de rebote (reloj de audio)
  const undoStackRef = useRef([])         // snapshots de steps para deshacer
  const countInTimerRef = useRef(null)    // timeout del count-in (cancelable al salir)
  const prevMetricGuideRef = useRef(false) // valor de la Guía métrica antes de grabar (se restaura)
  const stepsRef = useRef(steps)          // último steps para exitRecord/clearRecRing sin closures viejos
  const recApiRef = useRef(null)          // bundle de handlers fresco para el listener global
  const recNonceRef = useRef(0)           // alterna un sufijo invisible para que aria-live re-anuncie strings repetidos
  const recordToggleRef = useRef(null)    // botón ● del transporte (para devolverle el foco al salir)

  // Diálogos propios (en vez de prompt/confirm/alert nativos) y avisos no-bloqueantes
  const { modalState, closeModal, promptModal, confirmModal } = useModal()
  const { toast, showToast } = useToast()

  // Hint de primer uso: se muestra hasta que el usuario toca un círculo o lo cierra
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem('ogbon_onboarded') } catch { return false }
  })
  const hintDoneRef = useRef(false)
  const dismissHint = useCallback(() => {
    if (hintDoneRef.current) return
    hintDoneRef.current = true
    setShowHint(false)
    try { localStorage.setItem('ogbon_onboarded', '1') } catch { /* modo privado: no persiste */ }
  }, [])

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

  // Sync métrica a la guía métrica del motor (subdivisiones por compás / por pulso)
  useEffect(() => {
    engineRef.current?.setMeter(gridType, gridType === 12 ? 3 : 4)
  }, [gridType])

  // Sync toggle de Guía métrica
  useEffect(() => {
    engineRef.current?.setMetricGuide(metricGuide)
  }, [metricGuide])

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
    const newGrid = newGridType * measures
    // Cambiar la subdivisión (ternaria 12/8 ↔ cuaternaria 4/4) no tiene un mapeo 1:1
    // del patrón, así que se regenera vacío. (Sumar/quitar compases SÍ preserva el
    // ritmo: ver handleMeasuresChange.)
    if (engineRef.current.isPlayingNow()) engineRef.current.togglePlay()
    const newSteps = engineRef.current.setGrid(newGrid)
    setGridType(newGridType)
    setSteps(newSteps)
    setPlaying(false)
  }, [measures])

  const handleMeasuresChange = useCallback((val) => {
    const newMeasures = parseInt(val)
    const newGrid = gridType * newMeasures
    // Repetir cíclicamente el patrón actual: sumar compases DUPLICA el ritmo escrito;
    // quitar compases lo TRUNCA al primer compás (en vez de borrar todo).
    const tiled = steps.map(row => Array.from({ length: newGrid }, (_, i) => row.length ? row[i % row.length] : 0))
    if (engineRef.current.isPlayingNow()) engineRef.current.togglePlay()
    engineRef.current.setGrid(newGrid)
    engineRef.current.setSteps(tiled)
    setMeasures(newMeasures)
    setSteps(tiled)
    setPlaying(false)
  }, [gridType, steps])

  const handleStepToggle = useCallback((instIdx, stepIdx) => {
    dismissHint() // primer toque: cerrar la ayuda de onboarding (idempotente)
    setSteps(prev => {
      const next = prev.map(row => [...row])
      next[instIdx][stepIdx] = nextStepValue(next[instIdx][stepIdx], instIdx)
      return next
    })
  }, [dismissHint])

  // ---- Modo Toque (tap-to-circle) ----
  // Mantener stepsRef al día para leer el último steps sin closures viejos (exit/clear).
  useEffect(() => { stepsRef.current = steps }, [steps])

  const countHits = (s) => s.reduce((a, row) => a + row.reduce((b, v) => b + (v ? 1 : 0), 0), 0)

  // Anuncia por aria-live, alternando un sufijo invisible (ZWSP) para que un lector de pantalla
  // re-anuncie aunque el texto se repita (p. ej. "Nada para deshacer" dos veces seguidas).
  const announce = (msg) => {
    recNonceRef.current = (recNonceRef.current + 1) % 2
    setRecAnnounce(msg + (recNonceRef.current ? '​' : ''))
  }

  // Un tap: cuantiza contra el reloj de audio y escribe el golpe (idempotente) en el anillo activo.
  const recordTap = () => {
    const eng = engineRef.current
    if (!eng) return
    if (countingIn) { eng.metricTick(1); return }      // count-in: rechazo tenue, todavía no
    const now = eng.getCurrentTime()
    if (now - lastTapRef.current < 0.03) return         // dedupe de rebote (30 ms)
    lastTapRef.current = now
    const step = eng.tapToStep()
    if (step < 0) { eng.metricTick(1); return }          // loop parado: no hay aguja, rechazo
    const inst = recInst
    const value = inst === 0 ? 1 : (closedMode ? 2 : 1)
    // Snapshot ANTES del setSteps: el updater debe ser puro (en StrictMode se invoca 2 veces).
    undoStackRef.current.push(stepsRef.current.map(r => [...r]))
    if (undoStackRef.current.length > 64) undoStackRef.current.shift()
    setSteps(prev => writeHit(prev, inst, step, value))   // escribe por valor (no cicla → no borra)
    eng.previewHit(inst, value)                            // audio inmediato (antes del próximo loop)
    setKbCursor({ i: inst, s: step })                     // ancla visual: cursor dorado en la celda
  }

  const enterRecord = () => {
    if (recordMode) return
    if (measures > 2) {
      showToast('El Modo Toque trabaja mejor en 1 o 2 compases (en grillas largas el pulso se desvía). Bajá los compases para grabar.', 'info')
      return
    }
    dismissHint()
    prevMetricGuideRef.current = metricGuide
    setMetricGuide(true)                                   // la claqueta es obligatoria para grabar sin ver
    if (!engineRef.current.isPlayingNow()) {
      engineRef.current.scrubTo(0)                         // reposicionar en el "uno" ANTES de arrancar
      engineRef.current.togglePlay()                       // (si no, agenda steps del offset viejo)
    }
    setPlaying(engineRef.current.isPlayingNow())
    setRecInst(1)
    setClosedMode(false)
    setKbCursor({ i: 1, s: 0 })
    undoStackRef.current = []
    lastTapRef.current = 0
    setCountingIn(true)
    const oneMeasureMs = (engineRef.current.getLoopDuration() / Math.max(1, measures)) * 1000
    clearTimeout(countInTimerRef.current)
    countInTimerRef.current = setTimeout(() => { setCountingIn(false); announce('¡Ya! Tocá el ritmo.') }, oneMeasureMs)
    announce('Modo Toque. Grabás en Rum. Entrada en un compás.')
    setRecordMode(true)
  }

  const exitRecord = () => {
    if (!recordMode) return
    clearTimeout(countInTimerRef.current)
    setCountingIn(false)
    const n = countHits(stepsRef.current)
    announce(`Saliste del Modo Toque. ${n} ${n === 1 ? 'golpe' : 'golpes'} en este ritmo.`)
    setRecordMode(false)                                   // el loop sigue sonando (grabar ≠ transportar)
    recordToggleRef.current?.focus()                       // el foco vuelve al botón ● (no cae a <body>)
  }

  const changeRecInst = (i) => {
    if (i < 0 || i >= INSTRUMENTS.length) return
    setRecInst(i)
    const step = engineRef.current ? engineRef.current.getCurrentStep() : 0
    setKbCursor({ i, s: step })
    announce(`Ahora grabás en ${INSTRUMENTS[i].name}.`)
  }

  const toggleClosedMode = () => {
    if (recInst === 0) { announce('El Gã siempre toca abierto.'); return } // el idiófono no tiene cerrado
    const nv = !closedMode
    setClosedMode(nv)
    announce(nv ? 'Golpes cerrados.' : 'Golpes abiertos.')
  }

  const undoLastTap = () => {
    if (undoStackRef.current.length === 0) { announce('Nada para deshacer.'); return }
    setSteps(undoStackRef.current.pop())
    announce('Deshecho el último golpe.')
  }

  const clearRecRing = async () => {
    const hasHits = (stepsRef.current[recInst] || []).some(v => v > 0)
    if (!hasHits) { setRecAnnounce(`${INSTRUMENTS[recInst].name} ya está vacío.`); return }
    const ok = await confirmModal({
      title: 'Vaciar anillo',
      message: `¿Vaciar todos los golpes de ${INSTRUMENTS[recInst].name}?`,
      confirmLabel: 'Vaciar', danger: true
    })
    if (!ok) return
    undoStackRef.current.push(stepsRef.current.map(r => [...r]))   // snapshot ANTES (updater puro)
    setSteps(prev => {
      const next = prev.map(r => [...r])
      next[recInst] = next[recInst].map(() => 0)
      return next
    })
    announce(`${INSTRUMENTS[recInst].name} vacío.`)
  }

  const onToggleRecord = () => (recordMode ? exitRecord() : enterRecord())

  // Bundle fresco de handlers para que el listener global (suscrito una vez) nunca use closures viejos.
  useEffect(() => {
    recApiRef.current = { recordMode, recInst, recordTap, enterRecord, exitRecord, changeRecInst, toggleClosedMode, undoLastTap }
  })

  // Listener global en fase de CAPTURA: en Modo Toque el Espacio SIEMPRE tapea-cuantizado, antes que
  // el onKeyDown de la grilla accesible (evita doble-escritura). Fuera del modo sólo escucha "R".
  // Se ignora si el foco está en un input/textarea o dentro de un diálogo (no romper el Modal).
  useEffect(() => {
    const onKey = (e) => {
      const api = recApiRef.current
      if (!api) return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable ||
        (t.closest && t.closest('[role="dialog"]')))) return
      if (e.repeat) return
      if (e.code === 'KeyR') { e.preventDefault(); api.recordMode ? api.exitRecord() : api.enterRecord(); return }
      if (!api.recordMode) return
      // En Modo Toque, Espacio activa nativamente un botón de ACCIÓN enfocado (Salir, Deshacer,
      // PLAY…); pero en el botón TAP y en las celdas de la grilla, Espacio TAPEA (Enter siempre activa).
      if (e.code === 'Space' && t && t.tagName === 'BUTTON' && t.getAttribute('role') !== 'gridcell' && !t.classList.contains('ogbon-tap')) return
      switch (e.code) {
        case 'Space': e.preventDefault(); e.stopPropagation(); api.recordTap(); break
        case 'Escape': e.preventDefault(); e.stopPropagation(); api.exitRecord(); break
        case 'Backspace': e.preventDefault(); e.stopPropagation(); api.undoLastTap(); break
        case 'KeyC': e.preventDefault(); e.stopPropagation(); api.toggleClosedMode(); break
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
          e.preventDefault(); e.stopPropagation(); api.changeRecInst(Number(e.code.slice(5)) - 1); break
        case 'ArrowUp': e.preventDefault(); e.stopPropagation(); api.changeRecInst(api.recInst - 1); break
        case 'ArrowDown': e.preventDefault(); e.stopPropagation(); api.changeRecInst(api.recInst + 1); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // Restaurar la Guía métrica al valor previo al SALIR (cubre Escape, botón, R y desmontaje).
  useEffect(() => {
    if (!recordMode) return
    return () => { setMetricGuide(prevMetricGuideRef.current) }
  }, [recordMode])

  const handleGainChange = useCallback((idx, value) => {
    engineRef.current?.setGain(idx, value)
    setGains(prev => {
      const next = [...prev]
      next[idx] = value
      return next
    })
  }, [])

  const handlePresetChange = useCallback((key) => {
    if (recApiRef.current?.recordMode) recApiRef.current.exitRecord() // cargar un preset sale del Modo Toque
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

  const handleSave = useCallback(async () => {
    const name = await promptModal({
      title: 'Guardar ritmo',
      placeholder: 'Nombre del ritmo',
      confirmLabel: 'Guardar'
    })
    if (!name) return
    saveLocalPreset(name, { gridType, measures, grid, steps, bpm, gains })
    loadAllPresets().then(setPresetList)
    showToast(`Guardado: ${name}`, 'success')
  }, [gridType, measures, grid, steps, bpm, gains, promptModal, showToast])

  const handleDelete = useCallback(async () => {
    if (selectedPreset === 'Cargar...') return
    if (selectedPreset.startsWith('builtin_')) {
      showToast('Los toques incluidos (🪘) no se pueden borrar', 'info')
      return
    }
    const name = selectedPreset.replace('ogbon_', '')
    const ok = await confirmModal({
      title: 'Eliminar ritmo',
      message: `¿Querés eliminar "${name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true
    })
    if (!ok) return
    deleteLocalPreset(selectedPreset)
    loadAllPresets().then(setPresetList)
    setSelectedPreset('Cargar...')
    setPresetMeta(null)
    showToast(`Eliminado: ${name}`, 'success')
  }, [selectedPreset, confirmModal, showToast])

  const handleExport = useCallback(async () => {
    let exportName = 'ritmo_nuevo'
    if (selectedPreset !== 'Cargar...') {
      exportName = selectedPreset.replace('builtin_', '').replace('ogbon_', '')
    } else {
      const name = await promptModal({
        title: 'Exportar ritmo',
        message: 'Nombre del archivo .ogbon',
        defaultValue: 'Mi Ritmo',
        confirmLabel: 'Exportar'
      })
      if (!name) return
      exportName = name
    }
    exportPreset(exportName, { name: exportName, gridType, measures, grid, steps, bpm, gains })
    showToast('Archivo descargado', 'success')
  }, [selectedPreset, gridType, measures, grid, steps, bpm, gains, promptModal, showToast])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (recApiRef.current?.recordMode) recApiRef.current.exitRecord() // importar sale del Modo Toque
    const fail = () => { showToast('Archivo .ogbon inválido o incompatible', 'error'); e.target.value = '' }

    let data
    try {
      data = await importPreset(file) // puede rechazar si el JSON está corrupto
    } catch {
      fail()
      return
    }
    // Validar archivos externos: 4 instrumentos y grilla representable (múltiplo de 12 o 16)
    const total = (data && data.grid) || (data && Array.isArray(data.steps) && data.steps[0] ? data.steps[0].length : 0)
    if (!data || !Array.isArray(data.steps) || data.steps.length !== 4 || (total % 12 !== 0 && total % 16 !== 0)) {
      fail()
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
    // Métrica ambigua: sin gridType explícito y total divisible por 12 Y 16 (48, 96…) →
    // no se puede saber si es 12/8 o 4/4. Se asume 12/8 (ternario) pero se avisa.
    const ambiguous = !data.gridType && total % 48 === 0
    showToast(
      ambiguous ? 'Importado — métrica ambigua, se asumió 12/8 (guardalo para fijarla)' : 'Ritmo importado',
      ambiguous ? 'info' : 'success'
    )
  }, [measuresOptions, showToast])

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
          <select className={`${selectClass} disabled:opacity-40`} value={gridType} disabled={recordMode}
            title={recordMode ? 'Salí del Modo Toque para cambiar la métrica' : undefined}
            onChange={e => handleGridTypeChange(e.target.value)}>
            <option value={12}>Grilla: 12/8 (Ternaria)</option>
            <option value={16}>Grilla: 4/4 (Cuaternaria)</option>
          </select>
          <select className={`${selectClass} disabled:opacity-40`} value={measures} disabled={recordMode}
            title={recordMode ? 'Salí del Modo Toque para cambiar los compases' : undefined}
            onChange={e => handleMeasuresChange(e.target.value)}>
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

      {/* Contexto cultural del toque seleccionado (colapsable; el orixá queda a la vista) */}
      {presetMeta && (
        <CollapsiblePanel title={presetMeta.orixa.toLowerCase().startsWith('colectivo') ? 'Contexto cultural' : `Orixá: ${presetMeta.orixa}`}>
          <p className="opacity-90 leading-snug">{presetMeta.nota}</p>
          <p className="opacity-60 text-xs mt-2">Fuente: {presetMeta.fuente}</p>
          <p className="opacity-60 text-xs">Confianza: {presetMeta.confianza}</p>
          <p className="opacity-50 text-xs mt-1 italic">Aproximación didáctica, pendiente de validación comunitaria.</p>
        </CollapsiblePanel>
      )}

      {/* Hint de primer uso (se va al tocar un círculo o al cerrarlo) */}
      {showHint && <Onboarding onDismiss={dismissHint} />}

      {/* Círculo — protagonista (visual). La interacción accesible va en AccessibleGrid. */}
      <CircleCanvas
        engine={engineRef}
        instruments={INSTRUMENTS}
        steps={steps}
        grid={grid}
        showNeon={showNeon}
        showBeams={showBeams}
        showGlow={showGlow}
        onStepToggle={handleStepToggle}
        kbCursor={kbCursor}
      />
      {/* Editor accesible (teclado + lector de pantalla) del mismo ritmo */}
      <AccessibleGrid
        instruments={INSTRUMENTS}
        steps={steps}
        grid={grid}
        engine={engineRef}
        onStepToggle={handleStepToggle}
        onCursor={setKbCursor}
        practiceMode={practiceMode}
        metricGuide={metricGuide}
      />

      {/* Mezcla (ecualizador) — colapsable, para menos ruido */}
      <CollapsiblePanel title="🎚 Mezcla">
        <div className="flex justify-center gap-8 max-sm:gap-5 py-1">
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
      </CollapsiblePanel>

      {/* Partitura — tercera lectura del mismo ritmo, sincronizada con el círculo */}
      <CollapsiblePanel title="🎼 Partitura" defaultOpen>
        <p className="opacity-50 text-xs mb-2 leading-snug">
          La misma secuencia en notación de percusión. Tocá una posición para poner o sacar
          un golpe: el círculo y la partitura se editan juntos.
        </p>
        <NotationCanvas
          engine={engineRef}
          instruments={INSTRUMENTS}
          steps={steps}
          grid={grid}
          gridType={gridType}
          measures={measures}
          onStepToggle={handleStepToggle}
        />
      </CollapsiblePanel>

      {/* Efectos visuales (colapsable, para menos ruido) */}
      <CollapsiblePanel title="Efectos visuales">
        <div className="flex flex-wrap justify-center gap-2 items-center text-xs">
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
      </CollapsiblePanel>

      {/* Ayuda de teclado + modo Práctica (accesibilidad) */}
      <KeyboardHelp
        practiceMode={practiceMode}
        onTogglePractice={() => setPracticeMode(v => !v)}
        metricGuide={metricGuide}
        onToggleMetricGuide={() => setMetricGuide(v => !v)}
        recordMode={recordMode}
        onToggleRecord={onToggleRecord}
      />

      {/* Axé — visualización HONESTA del audio (colapsable, para menos ruido) */}
      <CollapsiblePanel title="🌀 Axé — Visualización">
        <div className="flex flex-col gap-2.5 w-full items-center">
          <p className="opacity-50 text-xs text-center leading-snug max-w-sm">
            {vizMode === 'bloom'
              ? 'Florecimiento de Axé: la señal real del audio, en forma radial. Cada golpe deja un pétalo que se expande.'
              : 'Osciloscopio: la forma de onda real de la mezcla. La textura sonora del toque.'}
          </p>
          <WaveCanvas
            engine={engineRef}
            instruments={INSTRUMENTS}
            steps={steps}
            vizMode={vizMode}
          />
          <button
            className={btnClass}
            onClick={() => setVizMode(v => v === 'bloom' ? 'scope' : 'bloom')}
          >
            Modo: {vizMode === 'bloom' ? 'Florecimiento' : 'Osciloscopio'}
          </button>
        </div>
      </CollapsiblePanel>

      {/* Transporte fijo abajo — PLAY + BPM siempre a mano; la barra de Modo Toque va encima */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e1e]/95 backdrop-blur border-t border-[#444] shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {recordMode && (
          <RecordBar
            instruments={INSTRUMENTS}
            recInst={recInst}
            closedMode={closedMode}
            countingIn={countingIn}
            onTap={recordTap}
            onChangeInst={changeRecInst}
            onToggleClosed={toggleClosedMode}
            onUndo={undoLastTap}
            onClear={clearRecRing}
            onExit={exitRecord}
          />
        )}
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            ref={recordToggleRef}
            onClick={onToggleRecord}
            aria-label={recordMode ? 'Salir del Modo Toque' : 'Entrar al Modo Toque para grabar tocando'}
            aria-pressed={recordMode}
            title={recordMode ? 'Grabando — tocá para salir' : 'Modo Toque (grabar tocando)'}
            className={`flex items-center justify-center rounded-full w-12 h-12 shrink-0 text-lg font-bold transition-transform duration-200 hover:scale-105 ${recordMode ? 'bg-[#e74c3c] text-white ring-2 ring-white/50' : 'bg-[#2a2a2a] text-[#e74c3c] border border-[#555]'}`}
          >
            ●
          </button>
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
            disabled={recordMode}
            title={recordMode ? 'Salí del Modo Toque para cambiar el tempo' : undefined}
            onChange={e => setBpm(parseInt(e.target.value))}
            className="flex-1 accent-[var(--gold)] disabled:opacity-40"
            aria-label="Tempo (BPM)"
          />
          <span className="text-sm tabular-nums w-16 text-right shrink-0">{bpm} BPM</span>
        </div>
      </div>

      {/* Región aria-live propia del Modo Toque (separada de la de la grilla accesible) */}
      <div className="sr-only" role="status" aria-live="polite">{recAnnounce}</div>

      {/* Diálogos propios y avisos no-bloqueantes (Iteración 3 — Comodidad) */}
      <Modal state={modalState} onClose={closeModal} />
      <Toast toast={toast} />
    </div>
  )
}
