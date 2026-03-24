import { useRef, useEffect } from 'react'

export default function CircleCanvas({ engine, instruments, steps, grid, showNeon, showBeams, showGlow, onStepToggle }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Mirror props into refs so the RAF loop always reads latest values
  const propsRef = useRef({ steps, grid, showNeon, showBeams, showGlow })
  useEffect(() => {
    propsRef.current = { steps, grid, showNeon, showBeams, showGlow }
  }, [steps, grid, showNeon, showBeams, showGlow])

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current
    function resize() {
      const maxCircle = 500
      const size = Math.min(maxCircle, window.innerWidth - 20)
      canvas.width = size
      canvas.height = size
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
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
      const currentStep = eng.getCurrentStep()
      const waveHistory = eng.getWaveHistory()
      const activeNotes = eng.getActiveNotes()
      const isPlaying = eng.isPlayingNow()

      const w = canvas.width, h = canvas.height
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

      // Beams
      if (beams) {
        const now = performance.now() / 1000
        for (let bi = activeNotes.length - 1; bi >= 0; bi--) {
          const note = activeNotes[bi]
          const elapsed = (eng.isPlayingNow() ? (performance.now() / 1000) : 0) === 0
            ? 0
            : (performance.now() / 1000) - (performance.now() / 1000 - (note.duration - 0))

          // Use audio context time for proper elapsed calculation
          // We approximate by checking startTime in the note
          const noteElapsed = eng.getPlaybackPos() !== undefined ?
            Math.max(0, (Date.now() / 1000) % 100 - (note.startTime % 100)) : 0

          if (noteElapsed > note.duration + 0.1) continue

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

  // Mouse/Touch events
  useEffect(() => {
    const canvas = canvasRef.current
    const eng = engine
    let isDragging = false
    let mouseDownPos = null
    let isScrubbing = false
    let lastScrubStep = -1

    function getCanvasCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect()
      const halfSize = canvas.width / 2
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
      const clickScale = canvas.width / 500
      const g = propsRef.current.grid

      instruments.forEach((inst, i) => {
        if (Math.abs(dist - inst.radius * clickScale) < 15 * clickScale) {
          const angle = Math.atan2(my, mx) + Math.PI / 2
          let normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle
          const step = Math.round((normalizedAngle / (Math.PI * 2)) * g) % g
          onStepToggle(i, step)
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

  return <canvas ref={canvasRef} width="500" height="500" />
}
