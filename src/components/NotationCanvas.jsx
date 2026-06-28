import { useRef, useEffect, useMemo, useCallback } from 'react'

/**
 * NotationCanvas — Partitura de percusión convencional, tercera lectura del MISMO ritmo
 * (las otras dos son el círculo radial y las ondas). SVG dibujado a mano, cero dependencias.
 *
 * Decisiones de grabado (validadas con investigación; ver docs/NOTACION.md):
 *  - 4 pentagramas de UNA línea (Gã/Rum/Rumpi/Lé, de arriba a abajo, en sus colores) —
 *    más legible y clickeable que un pentagrama de 5 líneas con 4 voces apiladas, y
 *    mapea 1:1 con los 4 anillos del círculo.
 *  - Clave neutral de percusión (dos barras verticales). Cifra de compás 12/8 ó 4/4.
 *  - Cabezas COHERENTES con el círculo: Gã (idiófono) = "×"; atabaque siempre RELLENO
 *    (la duración la dan plica/barra/puntillo) + marca de articulación: ○ abierto, + cerrado.
 *    (Una cabeza hueca = blanca/redonda chocaría con que lleve plica/bandera.)
 *  - Plicas largas (~3 espacios) hacia arriba; barras (beams) horizontales agrupadas por
 *    pulso: grupos de 3 corcheas (12/8) o de 4 semicorcheas con barra secundaria (4/4).
 *    Nunca se barra cruzando el pulso ni la barra de compás.
 *  - PUNTILLOS: una nota que dura 1,5× un valor binario (p. ej. un golpe sostenido todo un
 *    pulso en 12/8 = negra con puntillo) lleva un puntillo a la derecha de la cabeza, así
 *    no se confunde con la negra sola. (Sólo atabaques: el Gã es un idiófono que no sostiene.)
 *  - SILENCIOS por DURACIÓN: el hueco antes del primer golpe (o un compás vacío) se descompone
 *    en silencios estándar alineados al pulso (redonda/blanca/negra/corchea/…), no en un único
 *    glifo genérico. El resto del compás lo "rellenan" las duraciones de las notas (inter-onset).
 *  - MULTI-SISTEMA: si el patrón es largo (varios compases), se PARTE en varias líneas
 *    (sistemas) apiladas en vez de encoger todo para que entre — se mantiene legible.
 *  - Glifos como paths SVG (no fuentes musicales: soporte irregular en móvil).
 *
 * Edición bidireccional GRATIS: cada celda es un <rect> que llama al MISMO onStepToggle
 * que el círculo. Como `steps` vive en Ogbon.jsx, editar acá actualiza el círculo y
 * viceversa. El playhead se anima por RAF leyendo el engine por ref (fuera de React),
 * igual que el needle del círculo.
 */

// --- Constantes de layout (px lógicos) ---
const STEP_W = 25        // ancho por subdivisión
const ROW_H = 54         // alto por instrumento
const TOP_PAD = 14
const BOTTOM_PAD = 30    // espacio para la leyenda
const HEAD_X0 = 106      // donde empiezan las notas (tras etiqueta + bracket + clave + cifra)
const RIGHT_PAD = 16
const STEM_LEN = 30      // plica larga (anti-amateur)
const HEAD_RX = 6.2
const HEAD_RY = 4.8
const MEASURE_PAD = 10   // aire alrededor de cada barra de compás
const BEAM_H = 3.6
const BEAM_GAP = 3       // separación entre barra primaria y secundaria (semicorcheas)
const LINE_IN_ROW = 36   // posición de la línea del pentagrama dentro de su fila
const SYSTEM_GAP = 30    // aire vertical entre sistemas (líneas) cuando el patrón hace wrap
const SYS_TARGET_W = 680 // ancho objetivo de un sistema antes de partir en otra línea

export default function NotationCanvas({ engine, instruments, steps, grid, gridType, measures, onStepToggle }) {
  const playheadRef = useRef(null)
  const columnRef = useRef(null)
  const layoutRef = useRef(null)

  const nInst = instruments.length
  const unit = gridType === 12 ? 3 : 4          // subdivisiones por pulso
  const measuresSafe = Math.max(1, measures || 1)

  // Geometría dependiente de la grilla (incluye el wrap a varios sistemas)
  const layout = useMemo(() => {
    const measureW = gridType * STEP_W + MEASURE_PAD
    // Cuántos compases entran por sistema sin encoger las notas
    const availW = SYS_TARGET_W - HEAD_X0 - RIGHT_PAD
    const measuresPerSystem = Math.max(1, Math.min(measuresSafe, Math.round(availW / measureW)))
    const systemCount = Math.ceil(measuresSafe / measuresPerSystem)

    const bandH = TOP_PAD + nInst * ROW_H        // alto del contenido de un sistema (sin gap)
    const systemPitch = bandH + SYSTEM_GAP
    const svgW = HEAD_X0 + measuresPerSystem * measureW + RIGHT_PAD
    const svgH = (systemCount - 1) * systemPitch + bandH + BOTTOM_PAD

    const bandTop = (sys) => sys * systemPitch
    const lineY = (sys, i) => bandTop(sys) + TOP_PAD + i * ROW_H + LINE_IN_ROW

    const measureOf = (s) => Math.floor(s / gridType)
    const sysOf = (s) => Math.floor(measureOf(s) / measuresPerSystem)
    const measureInSys = (s) => measureOf(s) % measuresPerSystem
    const posInMeasure = (s) => s - measureOf(s) * gridType
    const measureLeftInSys = (mis) => HEAD_X0 + mis * measureW
    const cellLeft = (s) => measureLeftInSys(measureInSys(s)) + MEASURE_PAD / 2 + posInMeasure(s) * STEP_W
    const noteX = (s) => cellLeft(s) + STEP_W / 2

    // Posición continua del playhead. Interpola entre los x de pasos enteros (que respetan
    // el pad entre compases) salvo en la última celda de un sistema, donde avanza recto
    // (el siguiente paso está en otro sistema y no se puede interpolar el x).
    const playheadX = (f) => {
      const s0 = Math.floor(f)
      const x0 = noteX(s0)
      const s1 = s0 + 1
      if (s1 < grid && sysOf(s1) === sysOf(s0)) return x0 + (noteX(s1) - x0) * (f - s0)
      return x0 + STEP_W * (f - s0)
    }

    return {
      measureW, measuresPerSystem, systemCount, bandH, systemPitch, svgW, svgH,
      bandTop, lineY, sysOf, measureLeftInSys, cellLeft, noteX, playheadX
    }
  }, [gridType, measuresSafe, nInst, grid])

  // El RAF del playhead lee la geometría por ref (no durante el render).
  useEffect(() => { layoutRef.current = { ...layout, grid, nInst } }, [layout, grid, nInst])

  // Estructura de la partitura. La duración de cada nota = intervalo hasta el próximo
  // ataque (acotado al compás): así un golpe cada 2 semicorcheas se nota como CORCHEA.
  // El barrado agrupa por pulso; los puntillos y silencios se derivan de las duraciones.
  // Se recalcula sólo al EDITAR (cambia `steps`), no por frame.
  const score = useMemo(() => {
    const heads = []    // { i, x, ly, kind: 'x'|'open'|'closed', dotted }
    const stems = []    // { i, x, ly }
    const pBeams = []   // barra primaria { i, ly, x1, x2 }
    const sBeams = []   // barra secundaria / stub (semicorcheas) { i, ly, x1, x2 }
    const flags = []    // nota suelta { i, x, ly, count }
    const rests = []    // { i, cx, ly, dur }

    const { noteX, cellLeft, lineY, sysOf } = layout
    // Nº de barras según la duración (en pasos): 4/4 → semicorchea(2)/corchea(1)/negra+(0)
    const beamsForDur = (d) => gridType === 16 ? (d <= 1 ? 2 : (d < 4 ? 1 : 0)) : (d <= 1 ? 1 : 0)
    const beatsInMeasure = gridType / unit

    // ¿La duración d es un valor con puntillo (1,5× una potencia de dos)? d ∈ {3, 6, 12, …}
    const isPow2 = (n) => n > 0 && (n & (n - 1)) === 0
    const isDotted = (d) => d % 3 === 0 && isPow2(d / 3)

    // Descompone un silencio de longitud `len` (en subdivisiones, desde el inicio de compás)
    // en glifos estándar alineados al pulso. Los valores dividen el compás (12 ó 16), así
    // que el módulo relativo al inicio garantiza alineación correcta.
    const restValues = unit === 3 ? [12, 6, 3, 2, 1] : [16, 8, 4, 2, 1]
    const decomposeRest = (startAbs, len) => {
      const out = []
      let rel = 0, rem = len, guard = 0
      while (rem > 0 && guard++ < 48) {
        let v = 1
        for (const cand of restValues) { if (cand <= rem && rel % cand === 0) { v = cand; break } }
        out.push({ at: startAbs + rel, dur: v })
        rel += v; rem -= v
      }
      return out
    }

    for (let i = 0; i < nInst; i++) {
      const row = steps[i] || []
      for (let m = 0; m < measuresSafe; m++) {
        const mStart = m * gridType
        const mEnd = mStart + gridType
        const sys = sysOf(mStart)
        const onsets = []
        for (let s = mStart; s < mEnd; s++) if (row[s]) onsets.push(s)

        if (onsets.length === 0) {
          decomposeRest(mStart, gridType).forEach(r =>
            rests.push({ i, cx: cellLeft(r.at) + r.dur * STEP_W / 2, ly: lineY(sys, i), dur: r.dur }))
          continue
        }
        // Silencio(s) antes del primer golpe (descompuestos por duración, no un glifo genérico)
        if (onsets[0] > mStart) {
          decomposeRest(mStart, onsets[0] - mStart).forEach(r =>
            rests.push({ i, cx: cellLeft(r.at) + r.dur * STEP_W / 2, ly: lineY(sys, i), dur: r.dur }))
        }
        // Duraciones + cabezas/plicas
        const dur = {}
        for (let j = 0; j < onsets.length; j++) {
          const s = onsets[j]
          dur[s] = (j + 1 < onsets.length ? onsets[j + 1] : mEnd) - s
          const v = row[s]
          const kind = i === 0 ? 'x' : (v === 2 ? 'closed' : 'open')
          // Puntillo sólo en atabaques (el Gã es idiófono, no sostiene → puntillo sería ruido)
          heads.push({ i, x: noteX(s), ly: lineY(sys, i), kind, dotted: i !== 0 && isDotted(dur[s]) })
          stems.push({ i, x: noteX(s) + HEAD_RX, ly: lineY(sys, i) })
        }
        // Barrado por pulso
        for (let b = 0; b < beatsInMeasure; b++) {
          const bStart = mStart + b * unit
          const beamable = onsets.filter(s => s >= bStart && s < bStart + unit && beamsForDur(dur[s]) >= 1)
          if (beamable.length === 0) continue
          const ly = lineY(sys, i)
          if (beamable.length === 1) {
            flags.push({ i, x: noteX(beamable[0]) + HEAD_RX, ly, count: beamsForDur(dur[beamable[0]]) })
            continue
          }
          pBeams.push({ i, ly, x1: noteX(beamable[0]) + HEAD_RX, x2: noteX(beamable[beamable.length - 1]) + HEAD_RX })
          // Barra secundaria sólo sobre las semicorcheas (corridas; stub para una suelta)
          if (gridType === 16) {
            let k = 0
            while (k < beamable.length) {
              if (beamsForDur(dur[beamable[k]]) === 2) {
                const runStart = k
                while (k + 1 < beamable.length && beamsForDur(dur[beamable[k + 1]]) === 2) k++
                const xa = noteX(beamable[runStart]) + HEAD_RX
                const xb = noteX(beamable[k]) + HEAD_RX
                if (k > runStart) sBeams.push({ i, ly, x1: xa, x2: xb })
                else if (runStart > 0) sBeams.push({ i, ly, x1: xa - STEP_W * 0.5, x2: xa })
                else sBeams.push({ i, ly, x1: xa, x2: xa + STEP_W * 0.5 })
              }
              k++
            }
          }
        }
      }
    }
    return { heads, stems, pBeams, sBeams, flags, rests }
  }, [steps, gridType, unit, nInst, measuresSafe, layout])

  // --- Playhead + columna activa: RAF imperativo, sin re-render de React ---
  useEffect(() => {
    let raf
    const loop = () => {
      const eng = engine.current
      const L = layoutRef.current
      if (eng && L) {
        const pos = eng.getPlaybackPos()              // 0..1
        const playing = eng.isPlayingNow()
        const f = pos * L.grid
        const step = Math.min(L.grid - 1, Math.floor(f))
        const sys = L.sysOf(step)
        const yTop = L.bandTop(sys) + TOP_PAD - 6
        const yBot = L.bandTop(sys) + TOP_PAD + L.nInst * ROW_H + 6
        const x = L.playheadX(f)
        if (playheadRef.current) {
          playheadRef.current.setAttribute('x1', x)
          playheadRef.current.setAttribute('x2', x)
          playheadRef.current.setAttribute('y1', yTop)
          playheadRef.current.setAttribute('y2', yBot)
        }
        if (columnRef.current) {
          columnRef.current.setAttribute('x', L.cellLeft(step))
          columnRef.current.setAttribute('y', yTop)
          columnRef.current.setAttribute('height', yBot - yTop)
          columnRef.current.setAttribute('opacity', playing ? '1' : '0')
        }
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [engine])

  // Toggle de celda — MISMO handler que el círculo (estado compartido en Ogbon.jsx).
  const handleCell = useCallback((i, s) => { onStepToggle(i, s) }, [onStepToggle])

  const { svgW, svgH, cellLeft, lineY, sysOf, bandTop, measureW, measuresPerSystem, systemCount, measureLeftInSys } = layout
  const restColor = 'rgba(255,255,255,0.34)'

  // --- Glifos de silencio por duración (alineados al pulso) ---
  const restGlyph = (dur, cx, ly, key) => {
    const dot = (unit === 3 ? dur === 6 || dur === 3 : false)   // dotted-half / dotted-quarter (12/8)
    const dotEl = dot ? <circle cx={cx + 10} cy={ly - 2} r="1.7" fill={restColor} /> : null
    // whole (compás), half, quarter (squiggle), eighth, sixteenth
    if (dur >= gridType || dur === 16 || dur === 12) {
      return <g key={key}><rect x={cx - 7} y={ly + 1} width="14" height="5" fill={restColor} />{dotEl}</g> // redonda: cuelga
    }
    if (dur === 8 || dur === 6) {
      return <g key={key}><rect x={cx - 7} y={ly - 6} width="14" height="5" fill={restColor} />{dotEl}</g> // blanca: se apoya
    }
    if (dur === 2) {  // corchea: una banderita
      return (
        <g key={key} fill={restColor} stroke={restColor} strokeWidth="2" strokeLinecap="round">
          <line x1={cx + 2} y1={ly - 7} x2={cx - 3} y2={ly + 8} />
          <circle cx={cx + 2} cy={ly - 5} r="2.4" stroke="none" />
        </g>
      )
    }
    if (dur === 1) {  // semicorchea: dos banderitas
      return (
        <g key={key} fill={restColor} stroke={restColor} strokeWidth="2" strokeLinecap="round">
          <line x1={cx + 3} y1={ly - 8} x2={cx - 4} y2={ly + 9} />
          <circle cx={cx + 3} cy={ly - 6} r="2.2" stroke="none" />
          <circle cx={cx + 1.5} cy={ly - 1} r="2.2" stroke="none" />
        </g>
      )
    }
    // negra (dur 4 en 4/4) / negra con puntillo (dur 3 en 12/8): silencio de negra estilizado
    return (
      <g key={key}>
        <path
          d={`M ${cx - 3} ${ly - 11} q 6 4 1 9 q -6 4 1 9 q 5 3 1 8
              M ${cx - 1.5} ${ly + 6} q -6 1 -2 7 q 5 2 7 -2`}
          fill="none" stroke={restColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        />
        {dotEl}
      </g>
    )
  }

  // Bandera (corchete) al tope de la plica; count=1 (corchea) ó 2 (semicorchea).
  const flagGlyph = (x, topY, count, color, key) => {
    const parts = []
    for (let f = 0; f < count; f++) {
      const y = topY + f * 6
      parts.push(
        <path key={`${key}-${f}`}
          d={`M ${x} ${y} q 9 3 8 13 q 3 -8 -8 -16 Z`}
          fill={color} opacity="0.92"
        />
      )
    }
    return <g key={key}>{parts}</g>
  }

  return (
    <div className="ogbon-notation-scroll w-full max-w-2xl overflow-x-auto" aria-hidden="true">
      <svg
        width={svgW} height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="block mx-auto"
        style={{ width: '100%', maxWidth: svgW, height: 'auto' }}
      >
        {/* Columna del paso activo (debajo de todo; el RAF la posiciona en su sistema) */}
        <rect ref={columnRef} x={0} y={TOP_PAD - 6} width={STEP_W} height={nInst * ROW_H + 12}
          fill="rgba(255,215,0,0.10)" opacity="0" pointerEvents="none" />

        {/* Cromática por sistema: barras de compás, grilla de pulso, clave, cifra, etiquetas */}
        {Array.from({ length: systemCount }, (_, sys) => {
          const measuresHere = Math.min(measuresPerSystem, measuresSafe - sys * measuresPerSystem)
          const beatsPerMeasure = gridType / unit
          const gTop = bandTop(sys) + TOP_PAD - 2
          const gBot = bandTop(sys) + TOP_PAD + nInst * ROW_H + 2
          const sysRight = HEAD_X0 + measuresHere * measureW
          const isLastSystem = sys === systemCount - 1
          const sigMid = (lineY(sys, 0) + lineY(sys, nInst - 1)) / 2
          return (
            <g key={`sys-${sys}`}>
              {/* Barras de compás + grilla de pulso tenue */}
              {Array.from({ length: measuresHere }, (_, mis) => {
                const mLeft = measureLeftInSys(mis)
                const lines = [
                  <line key={`bar-${mis}`} x1={mLeft} y1={gTop} x2={mLeft} y2={gBot}
                    stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" />
                ]
                for (let bt = 1; bt < beatsPerMeasure; bt++) {
                  const bx = mLeft + MEASURE_PAD / 2 + bt * unit * STEP_W
                  lines.push(<line key={`beat-${mis}-${bt}`} x1={bx} y1={gTop} x2={bx} y2={gBot}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)
                }
                return <g key={`mg-${mis}`}>{lines}</g>
              })}
              {/* Barra final: doble en el último sistema; simple al cierre de los demás */}
              {isLastSystem ? (
                <g>
                  <line x1={sysRight - 5} y1={gTop} x2={sysRight - 5} y2={gBot} stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
                  <line x1={sysRight} y1={gTop} x2={sysRight} y2={gBot} stroke="rgba(255,255,255,0.45)" strokeWidth="2.6" />
                </g>
              ) : (
                <line x1={sysRight} y1={gTop} x2={sysRight} y2={gBot} stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" />
              )}

              {/* Cifra de compás: sólo en el primer sistema (convención) */}
              {sys === 0 && (
                <g fill="rgba(255,215,0,0.85)" fontFamily="Georgia, serif" fontSize="21" fontWeight="700" textAnchor="middle">
                  <text x={HEAD_X0 - 24} y={sigMid - 5}>{gridType === 12 ? '12' : '4'}</text>
                  <text x={HEAD_X0 - 24} y={sigMid + 17}>{gridType === 12 ? '8' : '4'}</text>
                </g>
              )}
              {/* Bracket que agrupa los 4 pentagramas como UN sistema */}
              <line x1={HEAD_X0 - 56} y1={lineY(sys, 0) - 7} x2={HEAD_X0 - 56} y2={lineY(sys, nInst - 1) + 7}
                stroke="rgba(230,230,230,0.55)" strokeWidth="2.4" strokeLinecap="round" />
              {/* Clave neutral de percusión (dos barras), centrada en el sistema */}
              <g fill="rgba(230,230,230,0.78)">
                <rect x={HEAD_X0 - 49} y={sigMid - 11} width="2.8" height="22" />
                <rect x={HEAD_X0 - 44} y={sigMid - 11} width="2.8" height="22" />
              </g>
              {/* Etiqueta + línea del pentagrama por instrumento */}
              {instruments.map((inst, i) => {
                const ly = lineY(sys, i)
                return (
                  <g key={`staff-${sys}-${i}`}>
                    <text x={6} y={ly + 4} fontSize="11" fontWeight="700" fill={inst.color}
                      fontFamily="'Segoe UI', sans-serif" letterSpacing="0.3">{inst.name}</text>
                    <line x1={HEAD_X0 - 8} y1={ly} x2={sysRight} y2={ly} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Silencios por duración */}
        {score.rests.map((r, k) => restGlyph(r.dur, r.cx, r.ly, `rest-${r.i}-${k}`))}

        {/* Plicas */}
        {score.stems.map(({ i, x, ly }, k) => (
          <line key={`stem-${i}-${k}`} x1={x} y1={ly - 1} x2={x} y2={ly - STEM_LEN}
            stroke={instruments[i].color} strokeWidth="1.6" />
        ))}

        {/* Barras primarias (horizontales, por pulso) */}
        {score.pBeams.map((bm, k) => (
          <rect key={`pbeam-${bm.i}-${k}`} x={bm.x1} y={bm.ly - STEM_LEN}
            width={Math.max(0, bm.x2 - bm.x1)} height={BEAM_H} fill={instruments[bm.i].color} />
        ))}
        {/* Barras secundarias (semicorcheas) y stubs */}
        {score.sBeams.map((bm, k) => (
          <rect key={`sbeam-${bm.i}-${k}`} x={bm.x1} y={bm.ly - STEM_LEN + BEAM_H + BEAM_GAP}
            width={Math.max(0, bm.x2 - bm.x1)} height={BEAM_H} fill={instruments[bm.i].color} />
        ))}

        {/* Banderas (notas sueltas) */}
        {score.flags.map((fl, k) =>
          flagGlyph(fl.x, fl.ly - STEM_LEN, fl.count, instruments[fl.i].color, `flag-${fl.i}-${k}`)
        )}

        {/* Cabezas de nota. Atabaques: cabeza RELLENA siempre (la duración la dan plica/barra/
            puntillo); la articulación va en una marca — ○ abierto, + cerrado. */}
        {score.heads.map(({ i, x, ly, kind, dotted }, k) => {
          const color = instruments[i].color
          if (kind === 'x') {
            const d = 5.2
            return (
              <g key={`head-${i}-${k}`} stroke={color} strokeWidth="2.1" strokeLinecap="round">
                <line x1={x - d} y1={ly - d} x2={x + d} y2={ly + d} />
                <line x1={x + d} y1={ly - d} x2={x - d} y2={ly + d} />
              </g>
            )
          }
          const my = ly + 13   // marca de articulación, debajo de la cabeza (las plicas van arriba)
          return (
            <g key={`head-${i}-${k}`}>
              <ellipse cx={x} cy={ly} rx={HEAD_RX} ry={HEAD_RY} transform={`rotate(-20 ${x} ${ly})`} fill={color} />
              {dotted && <circle cx={x + HEAD_RX + 5} cy={ly} r="1.8" fill={color} />}
              {kind === 'open'
                ? <circle cx={x} cy={my} r="2.9" fill="none" stroke={color} strokeWidth="1.3" />
                : <g stroke={color} strokeWidth="1.5" strokeLinecap="round">
                    <line x1={x - 3} y1={my} x2={x + 3} y2={my} />
                    <line x1={x} y1={my - 3} x2={x} y2={my + 3} />
                  </g>}
            </g>
          )
        })}

        {/* Playhead continuo (encima de las notas; el RAF lo mueve y reubica por sistema) */}
        <line ref={playheadRef} x1={0} y1={TOP_PAD - 6} x2={0} y2={TOP_PAD + nInst * ROW_H + 6}
          stroke="rgba(255,215,0,0.85)" strokeWidth="1.6" pointerEvents="none" />

        {/* Celdas de click transparentes (edición bidireccional) */}
        {instruments.map((inst, i) =>
          Array.from({ length: grid }, (_, s) => (
            <rect key={`cell-${i}-${s}`} className="ogbon-cell"
              x={cellLeft(s)} y={lineY(sysOf(s), i) - 30} width={STEP_W} height={46}
              onClick={() => handleCell(i, s)} />
          ))
        )}

        {/* Leyenda de cabezas y articulaciones */}
        <text x={HEAD_X0 - 56} y={svgH - 10} fontSize="10.5" fill="rgba(255,255,255,0.5)" fontFamily="'Segoe UI', sans-serif">
          × Gã · ○ abierto · + cerrado · ⋅ puntillo
        </text>
      </svg>
    </div>
  )
}
