import { useRef, useEffect, useState, useCallback } from 'react'

// Etiquetas de estado de cada golpe, para el anuncio a lectores de pantalla.
const GA_LABELS = ['silencio', 'golpe']
const DRUM_LABELS = ['silencio', 'abierto', 'cerrado']

// Próximo valor al ciclar un golpe (misma regla que Ogbon.handleStepToggle):
// 0→1→2→0; el Gã (i===0) solo alterna silencio↔golpe.
function nextStepValue(cur, instIdx) {
  let next = (cur + 1) % 3
  if (instIdx === 0 && next === 2) next = 0
  return next
}

// Lee una celda clampeando índices: un cambio de grilla nunca produce out-of-bounds.
function readCell(steps, instIdx, step) {
  const row = steps[Math.min(instIdx, steps.length - 1)] || []
  return row[Math.min(step, row.length - 1)] ?? 0
}

export default function CircleCanvas({ engine, instruments, steps, grid, showNeon, showBeams, showGlow, onStepToggle, practiceMode }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  // Tamaño lógico (CSS px) y devicePixelRatio actuales, para dibujar nítido en retina/móvil
  const sizeRef = useRef(500)
  const dprRef = useRef(1)

  // --- Accesibilidad por teclado (patrón "Non-Visual Beats", NYU + Ability Project) ---
  const [cursor, setCursor] = useState({ inst: 0, step: 0 })
  const [focused, setFocused] = useState(false)
  const [announce, setAnnounce] = useState('')
  const cursorRef = useRef(cursor)
  const focusedRef = useRef(false)
  useEffect(() => { cursorRef.current = cursor }, [cursor])
  useEffect(() => { focusedRef.current = focused }, [focused])

  // Mirror props into refs so the RAF loop always reads latest values
  const propsRef = useRef({ steps, grid, showNeon, showBeams, showGlow })
  useEffect(() => {
    propsRef.current = { steps, grid, showNeon, showBeams, showGlow }
  }, [steps, grid, showNeon, showBeams, showGlow])

  // Describe una celda para el lector de pantalla: "Rum · tiempo 3 de 16 · abierto"
  const describeCell = useCallback((instIdx, step, value) => {
    const inst = instruments[instIdx]
    const labels = instIdx === 0 ? GA_LABELS : DRUM_LABELS
    const g = propsRef.current.grid
    return `${inst.name} · tiempo ${step + 1} de ${g} · ${labels[value] ?? 'silencio'}`
  }, [instruments])

  // Resize — backing store en píxeles físicos (× dpr) pero medidas lógicas en CSS px
  useEffect(() => {
    const canvas = canvasRef.current
    function resize() {
      const maxCircle = 500
      const size = Math.min(maxCircle, window.innerWidth - 20)
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      sizeRef.current = size
      dprRef.current = dpr
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function drawFrame() {
      const eng = engine.current
      if (!eng) { animRef.current = requestAnimationFrame(drawFrame); return }

      eng.updatePlaybackPos()

      const { steps: s, grid: g, showNeon: neon, showBeams: beams, showGlow: glow } = propsRef.current
      const playbackPos = eng.getPlaybackPos()
      const waveHistory = eng.getWaveHistory()
      const activeNotes = eng.getActiveNotes()
      const isPlaying = eng.isPlayingNow()

      // Escala el contexto al dpr y trabaja en coordenadas lógicas (CSS px)
      const dpr = dprRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = sizeRef.current, h = sizeRef.current
      ctx.clearRect(0, 0, w, h)
      const centerX = w / 2, centerY = h / 2
      const scale = w / 500

      // Draw rings and steps
      instruments.forEach((inst, i) => {
        const r = inst.radius * scale

        // Shadow
        ctx.beginPath()
        ctx.arc(centerX + 2, centerY + 2, r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'
        ctx.lineWidth = 4
        ctx.stroke()

        // Base ring
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 1
        ctx.stroke()

        // Glow
        if (glow) {
          const amp = waveHistory[i][waveHistory[i].length - 1] || 0
          if (amp > 0.1) {
            ctx.beginPath()
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
            ctx.strokeStyle = inst.color
            ctx.lineWidth = 2 * amp
            ctx.globalAlpha = amp * 0.5
            ctx.stroke()
            ctx.globalAlpha = 1.0
          }
        }

        // Label
        ctx.fillStyle = inst.color
        ctx.font = '10px Segoe UI'
        ctx.fillText(inst.name, centerX - 10, centerY - r - 5)

        // Steps
        for (let st = 0; st < g; st++) {
          const angle = (st / g) * Math.PI * 2 - Math.PI / 2
          const x = centerX + Math.cos(angle) * r
          const y = centerY + Math.sin(angle) * r

          ctx.beginPath()
          if (i === 0) { // Gã
            if (s[i][st] === 1) {
              ctx.strokeStyle = inst.color
              ctx.lineWidth = 3
              ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5)
              ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5)
              ctx.stroke()
            } else {
              ctx.fillStyle = inst.color
              ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
            }
          } else { // Atabaques
            ctx.lineWidth = 2
            if (s[i][st] === 1) {
              ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.strokeStyle = inst.color; ctx.stroke()
            } else if (s[i][st] === 2) {
              ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = inst.color; ctx.fill()
            } else {
              ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#444'; ctx.fill()
            }
          }
        }
      })

      // Cursor de teclado — sólo cuando el círculo tiene foco (navegación accesible)
      if (focusedRef.current) {
        const cur = cursorRef.current
        const ci = Math.min(cur.inst, instruments.length - 1)
        const cs = Math.min(cur.step, g - 1)
        const r = instruments[ci].radius * scale
        const angle = (cs / g) * Math.PI * 2 - Math.PI / 2
        const x = centerX + Math.cos(angle) * r
        const y = centerY + Math.sin(angle) * r
        ctx.beginPath()
        ctx.arc(x, y, 13, 0, Math.PI * 2)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Needle (Playhead)
      const needleRadius = centerX - 30
      const needleAngle = playbackPos * Math.PI * 2 - Math.PI / 2

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + Math.cos(needleAngle) * needleRadius, centerY + Math.sin(needleAngle) * needleRadius)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])

      if (neon) { ctx.shadowBlur = 15; ctx.shadowColor = 'white' }
      ctx.beginPath()
      ctx.arc(centerX + Math.cos(needleAngle) * needleRadius, centerY + Math.sin(needleAngle) * needleRadius, 7, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.beginPath()
      ctx.arc(centerX + Math.cos(needleAngle) * (needleRadius + 2), centerY + Math.sin(needleAngle) * (needleRadius + 2), 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fill()

      // Beams — estela de luz que deja cada golpe sobre su anillo.
      // La antigüedad se mide con el reloj del AudioContext (mismo que note.startTime).
      if (beams) {
        const audioNow = eng.getCurrentTime()
        for (let bi = activeNotes.length - 1; bi >= 0; bi--) {
          const note = activeNotes[bi]
          const noteElapsed = audioNow - note.startTime
          if (noteElapsed < 0 || noteElapsed > note.duration + 0.1) continue

          const inst = instruments[note.instIdx]
          const alpha = Math.max(0, 1 - (noteElapsed / (note.duration + 0.1)))
          const startAngle = note.playheadAtStart * Math.PI * 2 - Math.PI / 2
          const currentAngle = isPlaying ? (playbackPos * Math.PI * 2 - Math.PI / 2) : startAngle + 0.1
          let endA = currentAngle
          if (endA < startAngle) endA += Math.PI * 2

          ctx.beginPath()
          ctx.arc(centerX, centerY, inst.radius * scale, startAngle, endA)
          ctx.strokeStyle = note.color
          ctx.lineWidth = 6
          ctx.lineCap = 'round'
          ctx.globalAlpha = alpha * 0.8
          if (neon) { ctx.shadowBlur = 15; ctx.shadowColor = note.color }
          ctx.stroke()
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1.0
        }
      }

      animRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()
    return () => cancelAnimationFrame(animRef.current)
  }, [engine, instruments])

  // Mouse/Touch events — trabajan en coordenadas lógicas (CSS px) vía getBoundingClientRect
  useEffect(() => {
    const canvas = canvasRef.current
    const eng = engine
    let isDragging = false
    let mouseDownPos = null
    let isScrubbing = false
    let lastScrubStep = -1

    function getCanvasCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect()
      const halfSize = rect.width / 2
      return {
        mx: clientX - rect.left - halfSize,
        my: clientY - rect.top - halfSize
      }
    }

    function handleScrub(clientX, clientY) {
      const { mx, my } = getCanvasCoords(clientX, clientY)
      const angle = Math.atan2(my, mx) + Math.PI / 2
      let normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle
      const pos = normalizedAngle / (Math.PI * 2)

      const scrubStep = eng.current.scrubTo(pos)

      if (scrubStep !== lastScrubStep) {
        eng.current.playScrubStep(scrubStep)
        lastScrubStep = scrubStep
      }
    }

    function handleClick(clientX, clientY) {
      const { mx, my } = getCanvasCoords(clientX, clientY)
      const dist = Math.sqrt(mx * mx + my * my)
      const rect = canvas.getBoundingClientRect()
      const clickScale = rect.width / 500
      const g = propsRef.current.grid

      instruments.forEach((inst, i) => {
        if (Math.abs(dist - inst.radius * clickScale) < 15 * clickScale) {
          const angle = Math.atan2(my, mx) + Math.PI / 2
          let normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle
          const step = Math.round((normalizedAngle / (Math.PI * 2)) * g) % g
          onStepToggle(i, step)
          // Mantener el cursor de teclado donde el usuario tocó (coherencia entre modos)
          setCursor({ inst: i, step })
        }
      })
    }

    function onMouseDown(e) {
      isDragging = false
      mouseDownPos = { x: e.clientX, y: e.clientY }
    }

    function onMouseMove(e) {
      if (!mouseDownPos) return
      const dx = e.clientX - mouseDownPos.x
      const dy = e.clientY - mouseDownPos.y
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true
        if (!eng.current.isPlayingNow() || isScrubbing) {
          isScrubbing = true
          if (eng.current.isPlayingNow()) eng.current.togglePlay()
          handleScrub(e.clientX, e.clientY)
        }
      }
    }

    function onMouseUp(e) {
      if (!isDragging && mouseDownPos) handleClick(e.clientX, e.clientY)
      mouseDownPos = null
      if (isScrubbing) { isScrubbing = false; lastScrubStep = -1 }
    }

    function onTouchStart(e) {
      e.preventDefault()
      isDragging = false
      mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    function onTouchMove(e) {
      e.preventDefault()
      if (!mouseDownPos) return
      const touch = e.touches[0]
      const dx = touch.clientX - mouseDownPos.x
      const dy = touch.clientY - mouseDownPos.y
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true
        if (!eng.current.isPlayingNow() || isScrubbing) {
          isScrubbing = true
          if (eng.current.isPlayingNow()) eng.current.togglePlay()
          handleScrub(touch.clientX, touch.clientY)
        }
      }
    }

    function onTouchEnd(e) {
      if (!isDragging && mouseDownPos) {
        const touch = e.changedTouches[0]
        handleClick(touch.clientX, touch.clientY)
      }
      mouseDownPos = null
      if (isScrubbing) { isScrubbing = false; lastScrubStep = -1 }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [engine, instruments, onStepToggle])

  // --- Teclado: navegación accesible por el secuenciador radial ---
  const handleKeyDown = useCallback((e) => {
    const g = propsRef.current.grid
    const s = propsRef.current.steps
    const nInst = instruments.length
    // Partimos siempre de un cursor válido (por si cambió la grilla)
    let inst = Math.min(cursorRef.current.inst, nInst - 1)
    let step = Math.min(cursorRef.current.step, g - 1)
    let handled = true

    switch (e.key) {
      case 'ArrowRight': step = (step + 1) % g; break
      case 'ArrowLeft': step = (step - 1 + g) % g; break
      case 'ArrowUp': inst = (inst - 1 + nInst) % nInst; break   // hacia el anillo externo (Gã)
      case 'ArrowDown': inst = (inst + 1) % nInst; break          // hacia el anillo interno (Lé)
      case 'Home': step = 0; break
      case 'End': step = g - 1; break
      case '1': case '2': case '3': case '4': {
        const idx = parseInt(e.key) - 1
        if (idx < nInst) inst = idx
        break
      }
      case ' ':
      case 'Enter': {
        // Togglear la celda actual y anunciar el nuevo estado
        onStepToggle(inst, step)
        const newVal = nextStepValue(readCell(s, inst, step), inst)
        setCursor({ inst, step })
        setAnnounce(describeCell(inst, step, newVal))
        if (practiceMode) engine.current?.previewHit(inst, newVal)
        e.preventDefault()
        return
      }
      default:
        handled = false
    }

    if (!handled) return
    e.preventDefault()
    const val = readCell(s, inst, step)
    setCursor({ inst, step })
    setAnnounce(describeCell(inst, step, val))
    // Modo Práctica: sonar la celda destino para ubicarse sin ver (si tiene golpe)
    if (practiceMode) engine.current?.previewHit(inst, val)
  }, [instruments, onStepToggle, describeCell, practiceMode, engine])

  const handleFocus = useCallback(() => {
    setFocused(true)
    const c = cursorRef.current
    setAnnounce(describeCell(c.inst, c.step, readCell(propsRef.current.steps, c.inst, c.step)))
  }, [describeCell])

  return (
    <>
      <canvas
        ref={canvasRef}
        width="500"
        height="500"
        tabIndex={0}
        role="application"
        aria-label="Secuenciador circular de ritmo. Flechas izquierda y derecha para moverte entre tiempos; flechas arriba y abajo para cambiar de instrumento; teclas 1 a 4 para elegir instrumento; barra espaciadora o Enter para poner o sacar un golpe."
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => setFocused(false)}
      />
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>
    </>
  )
}
