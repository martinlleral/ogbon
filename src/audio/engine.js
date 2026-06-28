/**
 * OGBÓN ENGINE: Síntesis y Secuenciador
 * Basado en la Nación Angola y la lógica de Atabaques
 * Módulo puro JS — no depende de React
 */

export function createAudioEngine(instruments) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  let isPlaying = false

  // Variables de tiempo y sincronía
  let startTime = 0
  let pauseTimeOffset = 0
  let currentPlaybackPos = 0

  let grid = 12
  let steps = instruments.map(() => Array(grid).fill(0))
  let currentStep = 0
  const activeNotes = []

  // Nodo Maestro y Compresión
  const masterCompressor = ctx.createDynamicsCompressor()
  masterCompressor.threshold.setValueAtTime(-24, ctx.currentTime)
  masterCompressor.knee.setValueAtTime(40, ctx.currentTime)
  masterCompressor.ratio.setValueAtTime(12, ctx.currentTime)
  masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime)
  masterCompressor.release.setValueAtTime(0.25, ctx.currentTime)

  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const masterFilter = ctx.createBiquadFilter()
  masterFilter.type = 'lowpass'
  masterFilter.frequency.setValueAtTime(18000, ctx.currentTime)
  masterFilter.Q.setValueAtTime(0.5, ctx.currentTime)

  masterCompressor.connect(masterFilter)
  masterFilter.connect(analyser)
  analyser.connect(ctx.destination)

  // Historial de amplitudes para visualización
  const waveHistory = { 0: [], 1: [], 2: [], 3: [], master: [] }
  const maxHistoryLength = 800

  // Buffer de ruido para percusión
  let noiseBuffer = null
  function createNoiseBuffer() {
    const bufferSize = ctx.sampleRate * 2
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
  }
  createNoiseBuffer()

  // Desconexión segura: un nodo ya desconectado (o detenido) lanza; lo ignoramos.
  function safeDisconnect(node) {
    try { node.disconnect() } catch { /* nodo ya desconectado */ }
  }

  // BPM
  let bpm = 110
  function getBPM() { return bpm }
  function getLoopDuration() { return (60 / getBPM()) * (grid / 4) }

  // --- Guía métrica (sonificación de la estructura) ---
  // El motor conoce la métrica para marcar pulsos y compases por audio:
  //  subPerMeasure = subdivisiones por compás (gridType: 12 ó 16),
  //  subPerBeat    = subdivisiones por pulso (unit: 3 en 12/8, 4 en 4/4).
  // Sirve a la accesibilidad (un músico ciego "siente" el esqueleto métrico) y a todos
  // (claqueta opcional). Es una pista de referencia, NO parte de la música: por eso su
  // click se enruta DIRECTO al destino (no pasa por el analyser), así no contamina la
  // visualización honesta del audio ni se mezcla con el compresor.
  let subPerMeasure = 12
  let subPerBeat = 3
  let metricGuide = false

  function metricKindOf(stepAbs) {
    const inMeasure = ((stepAbs % subPerMeasure) + subPerMeasure) % subPerMeasure
    if (inMeasure === 0) return 'downbeat'        // primer pulso del compás (tiempo fuerte)
    if (inMeasure % subPerBeat === 0) return 'beat' // pulso
    return 'sub'                                    // subdivisión (entre pulsos)
  }

  // Click sintético corto (sin samples), agudo y distinto por jerarquía métrica.
  function clickAt(time, kind) {
    const now = time
    const spec = kind === 'downbeat' ? { f: 2000, g: 0.5, d: 0.045 }
      : kind === 'beat' ? { f: 1320, g: 0.34, d: 0.035 }
        : { f: 880, g: 0.13, d: 0.025 }            // 'sub' — tenue (sólo al navegar)
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(spec.f, now)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(spec.g, now + 0.001)
    g.gain.exponentialRampToValueAtTime(0.0001, now + spec.d)
    osc.connect(g)
    g.connect(ctx.destination)                      // bypassa el analyser (guía, no música)
    osc.start(now)
    osc.stop(now + spec.d + 0.02)
    osc.onended = () => { safeDisconnect(osc); safeDisconnect(g) }
  }

  // Scheduling — patrón look-ahead de Chris Wilson (web.dev "A Tale of Two Clocks").
  // El timer JS dispara cada `lookahead` ms y agenda notas hasta `scheduleAheadTime` s
  // al futuro contra ctx.currentTime (reloj de hardware), desacoplando el jitter del
  // main thread (animación del canvas, GC) del pulso sample-accurate.
  let nextNoteTime = 0
  const lookahead = 25.0
  const scheduleAheadTime = 0.1
  let schedulerTimeout = null

  function addToHistory(instIdx, amplitude) {
    waveHistory[instIdx].push(amplitude)
    if (waveHistory[instIdx].length > maxHistoryLength) waveHistory[instIdx].shift()
    const masterAmp = amplitude * 0.5
    waveHistory.master.push({ idx: instIdx, amp: masterAmp })
    if (waveHistory.master.length > maxHistoryLength) waveHistory.master.shift()
  }

  function decayHistory() {
    for (let i = 0; i < 4; i++) {
      waveHistory[i] = waveHistory[i].map(v => v * 0.95)
      waveHistory[i] = waveHistory[i].filter(v => v > 0.01)
    }
    waveHistory.master = waveHistory.master.map(m => ({ ...m, amp: m.amp * 0.95 }))
    waveHistory.master = waveHistory.master.filter(m => m.amp > 0.01)
  }

  function playSound(instIdx, type, isClosed, time = ctx.currentTime) {
    const now = time
    // Podar notas viejas (ya no visibles como haces) usando el reloj del AudioContext,
    // así activeNotes no crece sin control y el dibujo no recorre notas muertas.
    const noteCutoff = now - 1.5
    for (let k = activeNotes.length - 1; k >= 0; k--) {
      if (activeNotes[k].startTime < noteCutoff) activeNotes.splice(k, 1)
    }
    while (activeNotes.length > 50) activeNotes.shift()
    const inst = instruments[instIdx]

    const instGain = ctx.createGain()
    const panner = ctx.createStereoPanner()
    const filter = ctx.createBiquadFilter()

    panner.pan.setValueAtTime(inst.pan, now)

    if (inst.type === 'metal') {
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(500, now)
    } else {
      if (inst.name === 'Rum') {
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1200, now)
      } else {
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(100, now)
      }
    }

    instGain.connect(filter)
    filter.connect(panner)
    panner.connect(masterCompressor)

    if (inst.type === 'metal') {
      const frequencies = [880, 1765, 2640, 3520]
      const gainsArr = [0.4, 0.2, 0.1, 0.05]
      const metalOscs = []
      const metalGains = []

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = i === 0 ? 'sine' : 'triangle'
        osc.frequency.setValueAtTime(freq, now)
        g.gain.setValueAtTime(gainsArr[i], now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + (i * 0.1))
        osc.connect(g)
        g.connect(instGain)
        osc.start(now)
        osc.stop(now + 0.6)
        metalOscs.push(osc)
        metalGains.push(g)
      })

      const click = ctx.createOscillator()
      const clickGain = ctx.createGain()
      click.type = 'square'
      click.frequency.setValueAtTime(4000, now)
      clickGain.gain.setValueAtTime(0.1, now)
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)
      click.connect(clickGain)
      clickGain.connect(instGain)
      click.start(now)
      click.stop(now + 0.02)

      const lastOsc = metalOscs[metalOscs.length - 1]
      lastOsc.onended = () => {
        metalOscs.forEach(safeDisconnect)
        metalGains.forEach(safeDisconnect)
        safeDisconnect(click)
        safeDisconnect(clickGain)
        safeDisconnect(instGain)
        safeDisconnect(filter)
        safeDisconnect(panner)
      }

      addToHistory(instIdx, 0.8)
      activeNotes.push({ instIdx, startTime: now, duration: 0.6, color: inst.color, playheadAtStart: currentPlaybackPos })

    } else {
      const baseFreq = inst.freq
      const decayTime = isClosed ? 0.08 : 0.45
      const noiseFilterFreq = isClosed ? 2500 : 1200

      const bodyOsc = ctx.createOscillator()
      const bodyGain = ctx.createGain()
      bodyOsc.type = 'sine'
      bodyOsc.frequency.setValueAtTime(baseFreq * 1.5, now)
      bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.03)
      bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + decayTime)
      bodyGain.gain.setValueAtTime(1.0, now)
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime)

      const harmOsc = ctx.createOscillator()
      const harmGain = ctx.createGain()
      harmOsc.type = 'sine'
      harmOsc.frequency.setValueAtTime(baseFreq * 2.1, now)
      harmGain.gain.setValueAtTime(0.4, now)
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime * 0.4)

      const harm2Osc = ctx.createOscillator()
      const harm2Gain = ctx.createGain()
      harm2Osc.type = 'triangle'
      harm2Osc.frequency.setValueAtTime(baseFreq * 3.2, now)
      harm2Gain.gain.setValueAtTime(0.15, now)
      harm2Gain.gain.exponentialRampToValueAtTime(0.001, now + decayTime * 0.25)

      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer
      const nFilter = ctx.createBiquadFilter()
      const nGain = ctx.createGain()
      nFilter.type = 'bandpass'
      nFilter.frequency.setValueAtTime(noiseFilterFreq, now)
      nFilter.Q.setValueAtTime(2.5, now)
      nGain.gain.setValueAtTime(isClosed ? 0.7 : 0.5, now)
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      bodyOsc.connect(bodyGain)
      harmOsc.connect(harmGain)
      harm2Osc.connect(harm2Gain)
      noiseSource.connect(nFilter)
      nFilter.connect(nGain)

      bodyGain.connect(instGain)
      harmGain.connect(instGain)
      harm2Gain.connect(instGain)
      nGain.connect(instGain)

      bodyOsc.start(now)
      harmOsc.start(now)
      harm2Osc.start(now)
      noiseSource.start(now)

      bodyOsc.stop(now + decayTime + 0.1)
      harmOsc.stop(now + decayTime + 0.1)
      harm2Osc.stop(now + decayTime + 0.1)
      noiseSource.stop(now + 0.1)

      bodyOsc.onended = () => {
        safeDisconnect(bodyOsc)
        safeDisconnect(bodyGain)
        safeDisconnect(harmOsc)
        safeDisconnect(harmGain)
        safeDisconnect(harm2Osc)
        safeDisconnect(harm2Gain)
        safeDisconnect(noiseSource)
        safeDisconnect(nFilter)
        safeDisconnect(nGain)
        safeDisconnect(instGain)
        safeDisconnect(filter)
        safeDisconnect(panner)
      }

      addToHistory(instIdx, isClosed ? 0.6 : 1.0)
      activeNotes.push({ instIdx, startTime: now, duration: decayTime, color: inst.color, playheadAtStart: currentPlaybackPos })
    }

    instGain.gain.setValueAtTime(inst.gain, now)
  }

  function scheduleStep(time) {
    const loopDuration = getLoopDuration()
    const relativeTime = (time - startTime) % loopDuration
    const stepIndex = Math.floor((relativeTime / loopDuration) * grid)

    // Claqueta de estructura: marca el downbeat (compás) y los pulsos. La subdivisión NO
    // suena en reproducción (sería ruido); sólo se oye al navegar con el teclado.
    if (metricGuide) {
      const kind = metricKindOf(stepIndex)
      if (kind !== 'sub') clickAt(time, kind)
    }

    instruments.forEach((inst, i) => {
      const s = steps[i][stepIndex]
      if (s === 1) playSound(i, inst.type, false, time)
      else if (s === 2) playSound(i, inst.type, true, time)
    })
  }

  function advanceStep() {
    const loopDuration = getLoopDuration()
    const stepSeconds = loopDuration / grid
    if (nextNoteTime === 0) nextNoteTime = ctx.currentTime
    nextNoteTime += stepSeconds
  }

  function scheduler() {
    if (!isPlaying) return
    while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
      scheduleStep(nextNoteTime)
      advanceStep()
    }
    schedulerTimeout = setTimeout(scheduler, lookahead)
  }

  // Latencia de salida: el tiempo entre que se AGENDA un sonido (reloj de ctx) y que realmente
  // SUENA en el parlante. Incluye el buffer del SO y —sobre todo— el retardo de Bluetooth
  // (auriculares/parlantes BT suman 150-300 ms). La aguja se dibuja con ctx.currentTime, así que
  // sin compensar va ADELANTADA respecto de lo que se oye (notorio a tempo lento). Restamos la
  // latencia para que la aguja —y la cuantización del tap— marchen con el SONIDO, no con el reloj.
  // El scheduler NO se compensa: agenda eventos a futuro y debe usar el reloj crudo.
  function audibleElapsed() {
    return ctx.currentTime - (ctx.outputLatency || 0) - startTime
  }

  // Called every animation frame by canvas components
  function updatePlaybackPos() {
    if (isPlaying) {
      const loopDuration = getLoopDuration()
      // módulo seguro: al arrancar, audibleElapsed puede ser negativo (aún no salió el sonido)
      const e = ((audibleElapsed() % loopDuration) + loopDuration) % loopDuration
      currentPlaybackPos = e / loopDuration
      currentStep = Math.floor(currentPlaybackPos * grid) % grid
    }
    decayHistory()
  }

  return {
    resume() { return ctx.resume() },

    togglePlay() {
      if (ctx.state === 'suspended') ctx.resume()
      isPlaying = !isPlaying

      if (isPlaying) {
        startTime = ctx.currentTime - pauseTimeOffset
        const loopDuration = getLoopDuration()
        const stepSeconds = loopDuration / grid
        nextNoteTime = startTime + Math.ceil(pauseTimeOffset / stepSeconds) * stepSeconds
        scheduler()
      } else {
        clearTimeout(schedulerTimeout)
        const loopDuration = getLoopDuration()
        pauseTimeOffset = (ctx.currentTime - startTime) % loopDuration
      }

      return isPlaying
    },

    setGrid(newGrid) {
      grid = newGrid
      steps = instruments.map(() => Array(grid).fill(0))
      pauseTimeOffset = 0
      currentPlaybackPos = 0
      if (isPlaying) {
        startTime = ctx.currentTime
        nextNoteTime = ctx.currentTime
      } else {
        nextNoteTime = 0
      }
      return steps
    },

    setBPM(val) { bpm = val },

    setSteps(newSteps) { steps = newSteps },

    // Métrica para la sonificación: subPerMeasure = subdivisiones por compás (gridType),
    // subPerBeat = subdivisiones por pulso (unit). Ogbón la sincroniza al cambiar la grilla.
    setMeter(perMeasure, perBeat) {
      subPerMeasure = perMeasure
      subPerBeat = perBeat
    },
    setMetricGuide(on) { metricGuide = !!on },
    isMetricGuide() { return metricGuide },

    // Click de posición métrica al navegar con el teclado (incluye la subdivisión, tenue,
    // para orientarse sin ver). Independiente del modo Práctica: lo gobierna la Guía métrica.
    metricTick(stepAbs) {
      if (ctx.state === 'suspended') ctx.resume()
      clickAt(ctx.currentTime, metricKindOf(stepAbs))
    },

    setGain(idx, value) { instruments[idx].gain = value },

    getPlaybackPos() { return currentPlaybackPos },

    // Cuantiza un TAP a la celda más cercana, recomputando la posición FRESCA contra el reloj
    // de hardware (ctx.currentTime), no el currentPlaybackPos cacheado por el RAF de los canvas
    // (que puede quedar ~16ms+ viejo, o congelarse si la pestaña va a background). Mismo cálculo
    // que updatePlaybackPos y misma fórmula round(pos*grid)%grid que el mouse en CircleCanvas, así
    // tap/mouse/teclado cuantizan idéntico. Devuelve -1 si el loop no está sonando (no hay aguja).
    tapToStep() {
      if (!isPlaying) return -1
      const loopDuration = getLoopDuration()
      // Mismo tiempo audible que la aguja: si el usuario tapea cuando OYE el pulso, cae en su celda.
      const rel = ((audibleElapsed() % loopDuration) + loopDuration) % loopDuration
      return Math.round((rel / loopDuration) * grid) % grid
    },

    getCurrentTime() { return ctx.currentTime },
    getCurrentStep() { return currentStep },
    getGrid() { return grid },
    getActiveNotes() { return activeNotes },
    getWaveHistory() { return waveHistory },
    isPlayingNow() { return isPlaying },
    getLoopDuration,
    updatePlaybackPos,

    getAnalyserData() {
      analyser.getByteTimeDomainData(dataArray)
      return { dataArray, bufferLength }
    },

    scrubTo(normalizedAngle) {
      currentPlaybackPos = normalizedAngle
      const loopDuration = getLoopDuration()
      pauseTimeOffset = currentPlaybackPos * loopDuration

      if (isPlaying) {
        startTime = ctx.currentTime - pauseTimeOffset
        const stepSeconds = loopDuration / grid
        nextNoteTime = startTime + Math.ceil(pauseTimeOffset / stepSeconds) * stepSeconds
      }

      const scrubStep = Math.floor(currentPlaybackPos * grid)
      return scrubStep
    },

    playScrubStep(scrubStep) {
      instruments.forEach((inst, i) => {
        if (steps[i][scrubStep] === 1) playSound(i, inst.type, false)
        if (steps[i][scrubStep] === 2) playSound(i, inst.type, true)
      })
    },

    // Reproduce el golpe de UN instrumento (modo Práctica del teclado accesible).
    // value: 0 silencio (no suena), 1 abierto, 2 cerrado.
    previewHit(instIdx, value) {
      if (ctx.state === 'suspended') ctx.resume()
      if (!value) return
      const inst = instruments[instIdx]
      playSound(instIdx, inst.type, value === 2)
    },

    applyPreset(data) {
      grid = data.grid
      steps = data.steps
      bpm = parseFloat(data.bpm)
      if (data.gains) {
        data.gains.forEach((g, i) => { instruments[i].gain = g })
      }
      pauseTimeOffset = 0
      if (isPlaying) {
        clearTimeout(schedulerTimeout)
        isPlaying = false
      }
      return { grid, steps, bpm, gains: instruments.map(i => i.gain) }
    },

    destroy() {
      clearTimeout(schedulerTimeout)
      isPlaying = false
      ctx.close()
    }
  }
}
