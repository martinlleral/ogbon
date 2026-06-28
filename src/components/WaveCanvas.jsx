import { useRef, useEffect } from 'react'

// Decima la forma de onda a N puntos y la suaviza (3-tap). Decimar + curvas evita los
// quiebres duros de dibujar 2048 segmentos rectos; queda una curva más orgánica.
// `wrap` = true para la corona radial (lazo cerrado), false para el osciloscopio.
function smoothWave(dataArray, bufferLength, N, wrap) {
  const raw = new Array(N)
  for (let i = 0; i < N; i++) {
    const idx = wrap ? Math.floor((i / N) * bufferLength) : Math.floor((i / (N - 1)) * (bufferLength - 1))
    raw[i] = (dataArray[idx] - 128) / 128
  }
  const out = new Array(N)
  for (let i = 0; i < N; i++) {
    const a = wrap ? raw[(i - 1 + N) % N] : raw[Math.max(0, i - 1)]
    const c = wrap ? raw[(i + 1) % N] : raw[Math.min(N - 1, i + 1)]
    out[i] = (a + 2 * raw[i] + c) / 4
  }
  return out
}

// Curva suave que pasa por los puntos medios (redondea cada esquina). Cerrada o abierta.
function smoothPath(ctx, pts, closed) {
  const n = pts.length
  if (closed) {
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2)
    for (let i = 0; i < n; i++) {
      const cur = pts[i], nxt = pts[(i + 1) % n]
      ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + nxt[0]) / 2, (cur[1] + nxt[1]) / 2)
    }
  } else {
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 0; i < n - 1; i++) {
      const cur = pts[i], nxt = pts[i + 1]
      ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + nxt[0]) / 2, (cur[1] + nxt[1]) / 2)
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1])
  }
}

/**
 * WaveCanvas — Visualización de audio HONESTA y de marca para Ogbón.
 *
 * Historia (ver docs/EVAL-ONDAS.md): la versión vieja tenía dos modos con problemas de
 * integridad — "Ondas Paralelas" (envolventes scripteadas, no señal real, redundantes con
 * el círculo) y un "espectro" que NO era un espectro (reusaba datos time-domain). En un
 * proyecto cuya propuesta es la honestidad (los presets declaran su nivel de confianza),
 * fingir precisión erosiona la confianza. Se rehízo apoyándose SÓLO en datos reales:
 *
 *  - 'bloom' (Florecimiento de Axé) — visual de marca, radial (rima con el secuenciador).
 *    La forma de onda REAL del master (getByteTimeDomainData) se mapea a RADIO: una corona
 *    dorada que late con la señal. Cada golpe emite un PÉTALO que se expande y desvanece,
 *    alimentado por `activeNotes` (la MISMA data de evento que dispara el audio — principio
 *    McLaren/ANIMUSIC: la imagen nace del sonido, no de un sin() inventado). Axé = energía.
 *  - 'scope' (Osciloscopio) — la forma de onda real del master, ventaneada y con brillo.
 *    Lectura analítica honesta de la textura sonora agregada. Sin barras de espectro falsas.
 */
export default function WaveCanvas({ engine, instruments, steps, vizMode }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dimsRef = useRef({ w: 440, h: 320 })
  const dprRef = useRef(1)

  const propsRef = useRef({ steps, vizMode })
  useEffect(() => { propsRef.current = { steps, vizMode } }, [steps, vizMode])

  // Resize — backing store en píxeles físicos (× dpr), medidas lógicas en CSS px.
  // Área cuadrada-ish para que el florecimiento radial no quede aplastado.
  useEffect(() => {
    const canvas = canvasRef.current
    function resize() {
      const waveWidth = Math.min(460, window.innerWidth - 24)
      const waveHeight = Math.min(waveWidth, 340)
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(waveWidth * dpr)
      canvas.height = Math.round(waveHeight * dpr)
      canvas.style.width = waveWidth + 'px'
      canvas.style.height = waveHeight + 'px'
      dimsRef.current = { w: waveWidth, h: waveHeight }
      dprRef.current = dpr
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    // Respeta a quien pide menos movimiento: no se dibujan los pétalos que se expanden.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // --- Florecimiento de Axé: corona radial (señal real) + pétalos de evento ---
    function drawBloom(wW, wH, eng) {
      const cx = wW / 2, cy = wH / 2
      const { dataArray, bufferLength } = eng.getAnalyserData()   // time-domain REAL
      const activeNotes = eng.getActiveNotes()
      const audioNow = eng.getCurrentTime()
      const isPlaying = eng.isPlayingNow()
      const baseR = Math.min(wW, wH) * 0.27

      ctx.fillStyle = '#0e0e0e'
      ctx.fillRect(0, 0, wW, wH)

      // 1) Pétalos de evento (honestos: uno por golpe, desde activeNotes). Sin shadowBlur
      //    por pétalo (lo más caro en móvil): el glow se logra con 'lighter'.
      if (!reduce) {
        ctx.globalCompositeOperation = 'lighter'
        for (let k = activeNotes.length - 1; k >= 0; k--) {
          const note = activeNotes[k]
          const elapsed = audioNow - note.startTime
          const life = note.duration + 0.7
          if (elapsed < 0 || elapsed > life) continue
          const t = elapsed / life
          const r = baseR * (0.45 + t * 1.5)
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = note.color
          ctx.globalAlpha = (1 - t) * 0.45
          ctx.lineWidth = 1.5 + (1 - t) * 3.5
          ctx.stroke()
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }

      // Energía global = RMS REAL de la señal del master (no una envolvente scripteada),
      // así el núcleo y el aura también reflejan el audio MEDIDO.
      let sum = 0
      for (let i = 0; i < bufferLength; i++) { const d = dataArray[i] / 128 - 1; sum += d * d }
      const coreAmp = Math.min(1, Math.sqrt(sum / bufferLength) * 3.4)

      // 2) Aura central (energía)
      const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.7)
      aura.addColorStop(0, `rgba(255,215,0,${0.08 + coreAmp * 0.32})`)
      aura.addColorStop(0.5, 'rgba(255,140,0,0.05)')
      aura.addColorStop(1, 'rgba(14,14,14,0)')
      ctx.fillStyle = aura
      ctx.fillRect(0, 0, wW, wH)

      // 3) Corona radial = forma de onda real, SUAVIZADA (decimada + curvas) → más orgánica
      const N = 100
      const ringAmp = baseR * 0.42
      const wave = smoothWave(dataArray, bufferLength, N, true)
      const pts = new Array(N)
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2 - Math.PI / 2
        const r = baseR + wave[i] * ringAmp
        pts[i] = [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]
      }
      ctx.beginPath()
      smoothPath(ctx, pts, true)
      ctx.closePath()
      const grad = ctx.createLinearGradient(cx - baseR, cy - baseR, cx + baseR, cy + baseR)
      grad.addColorStop(0, '#ffd700')
      grad.addColorStop(1, '#ff8c00')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2.4
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 0.92
      ctx.shadowColor = 'rgba(255,200,0,0.55)'
      ctx.shadowBlur = isPlaying ? 16 : 6
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      // 4) Núcleo que late con la energía
      ctx.beginPath()
      ctx.arc(cx, cy, 3.5 + coreAmp * 11, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,232,160,0.92)'
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 14
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // --- Osciloscopio: forma de onda real del master, honesta (sin espectro falso) ---
    function drawScope(wW, wH, eng, s) {
      const { dataArray, bufferLength } = eng.getAnalyserData()
      const currentStep = eng.getCurrentStep()
      const isPlaying = eng.isPlayingNow()
      const cyc = wH / 2

      ctx.fillStyle = '#0e0e0e'
      ctx.fillRect(0, 0, wW, wH)

      // Aura suave
      const aura = ctx.createRadialGradient(wW / 2, cyc, 0, wW / 2, cyc, wW / 2)
      aura.addColorStop(0, 'rgba(40, 36, 18, 0.25)')
      aura.addColorStop(1, 'rgba(14,14,14,0)')
      ctx.fillStyle = aura
      ctx.fillRect(0, 0, wW, wH)

      // Línea base
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.moveTo(20, cyc); ctx.lineTo(wW - 20, cyc); ctx.stroke()

      // Forma de onda real (time-domain), SUAVIZADA y ventaneada con una gaussiana
      const Ns = 140
      const wave = smoothWave(dataArray, bufferLength, Ns, false)
      const pts = new Array(Ns)
      for (let i = 0; i < Ns; i++) {
        const win = Math.exp(-Math.pow((i - Ns / 2) / (Ns / 3), 2))
        pts[i] = [20 + (i / (Ns - 1)) * (wW - 40), cyc + wave[i] * (wH / 2.4) * win]
      }
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(255,200,0,0.4)'
      ctx.shadowBlur = isPlaying ? 10 : 4
      smoothPath(ctx, pts, false)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Indicadores de actividad por instrumento (honestos: leen el paso actual real)
      instruments.forEach((inst, i) => {
        const xPos = Math.round(wW * 0.5 + (i - 1.5) * 34)
        // Clampea el paso (la grilla pudo achicarse): evita un dot fantasma con índice OOB.
        const cell = s[i] ? (s[i][currentStep] ?? 0) : 0
        const active = cell !== 0 && isPlaying
        ctx.beginPath()
        ctx.arc(xPos, wH - 18, 6, 0, Math.PI * 2)
        if (active) {
          ctx.fillStyle = inst.color
          ctx.shadowColor = inst.color
          ctx.shadowBlur = 12
          ctx.fill()
          ctx.shadowBlur = 0
        } else {
          ctx.strokeStyle = inst.color + '60'
          ctx.stroke()
        }
      })
    }

    function drawFrame() {
      const eng = engine.current
      if (!eng) { animRef.current = requestAnimationFrame(drawFrame); return }
      eng.updatePlaybackPos()

      const { steps: s, vizMode: mode } = propsRef.current
      const dpr = dprRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const wW = dimsRef.current.w, wH = dimsRef.current.h

      if (mode === 'scope') drawScope(wW, wH, eng, s)
      else drawBloom(wW, wH, eng)

      animRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()
    return () => cancelAnimationFrame(animRef.current)
  }, [engine, instruments])

  return <canvas ref={canvasRef} width="440" height="320" />
}
