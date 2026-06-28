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
 *  - Cabezas COHERENTES con el círculo: Gã (idiófono) = "×"; atabaque ABIERTO = cabeza
 *    HUECA (outline); CERRADO = cabeza RELLENA. (El círculo ya usa hueco/relleno.)
 *  - Plicas largas (~3.5 espacios) hacia arriba; barras (beams) horizontales agrupadas
 *    por pulso: grupos de 3 corcheas (12/8) o de 4 semicorcheas con barra secundaria (4/4).
 *    Nunca se barra cruzando el pulso ni la barra de compás.
 *  - Silencio convencional por PULSO vacío (no uno por celda) + grilla de pulso tenue.
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

// Etiquetas de la leyenda de cabezas
function lineY(i) { return TOP_PAD + i * ROW_H + LINE_IN_ROW }

export default function NotationCanvas({ engine, instruments, steps, grid, gridType, measures, onStepToggle }) {
  const playheadRef = useRef(null)
  const columnRef = useRef(null)
  const layoutRef = useRef(null)

  const nInst = instruments.length
  const unit = gridType === 12 ? 3 : 4          // subdivisiones por pulso
  const measuresSafe = Math.max(1, measures || 1)

  // Geometría dependiente de la grilla
  const layout = useMemo(() => {
    const measureW = gridType * STEP_W + MEASURE_PAD
    const svgW = HEAD_X0 + measuresSafe * measureW + RIGHT_PAD
    const svgH = TOP_PAD + nInst * ROW_H + BOTTOM_PAD
    const measureLeft = (m) => HEAD_X0 + m * measureW
    const cellLeft = (s) => {
      const m = Math.floor(s / gridType)
      const pos = s - m * gridType
      return measureLeft(m) + MEASURE_PAD / 2 + pos * STEP_W
    }
    const noteX = (s) => cellLeft(s) + STEP_W / 2
    // Posición continua del playhead: interpola entre los x de pasos enteros (que ya
    // respetan el pad entre compases), así NO salta en cada barra de compás.
    const playheadX = (f) => {
      const s0 = Math.floor(f)
      return noteX(s0) + (noteX(s0 + 1) - noteX(s0)) * (f - s0)
    }
    return { measureW, svgW, svgH, measureLeft, cellLeft, noteX, playheadX }
  }, [gridType, measuresSafe, nInst])

  // El RAF del playhead lee la geometría por ref (no durante el render).
  useEffect(() => { layoutRef.current = { ...layout, grid } }, [layout, grid])

  // Estructura de la partitura. La duración de cada nota = intervalo hasta el próximo
  // ataque (acotado al compás): así un golpe cada 2 semicorcheas se nota como CORCHEA
  // (no semicorchea), que es lo correcto y se lee limpio. El barrado agrupa por pulso.
  // Se recalcula sólo al EDITAR (cambia `steps`), no por frame.
  const score = useMemo(() => {
    const heads = []    // { i, s, kind: 'x'|'open'|'closed' }
    const stems = []    // { i, s }
    const pBeams = []   // barra primaria { i, x1, x2 }
    const sBeams = []   // barra secundaria / stub (semicorcheas) { i, x1, x2 }
    const flags = []    // nota suelta { i, s, count }
    const rests = []    // { i, cx }

    // Nº de barras según la duración (en pasos): 4/4 → semicorchea(2)/corchea(1)/negra+(0)
    const beamsForDur = (d) => gridType === 16 ? (d <= 1 ? 2 : (d < 4 ? 1 : 0)) : (d <= 1 ? 1 : 0)
    const beatsInMeasure = gridType / unit

    for (let i = 0; i < nInst; i++) {
      const row = steps[i] || []
      for (let m = 0; m < measuresSafe; m++) {
        const mStart = m * gridType
        const mEnd = mStart + gridType
        const onsets = []
        for (let s = mStart; s < mEnd; s++) if (row[s]) onsets.push(s)

        if (onsets.length === 0) {
          rests.push({ i, cx: layout.noteX(mStart) + ((gridType - 1) / 2) * STEP_W })
          continue
        }
        // Silencio inicial si el compás no arranca con golpe (offset RELATIVO al compás)
        if (onsets[0] > mStart) {
          rests.push({ i, cx: layout.noteX(mStart) + ((onsets[0] - mStart) / 2) * STEP_W })
        }
        // Duraciones + cabezas/plicas
        const dur = {}
        for (let j = 0; j < onsets.length; j++) {
          const s = onsets[j]
          dur[s] = (j + 1 < onsets.length ? onsets[j + 1] : mEnd) - s
          const v = row[s]
          heads.push({ i, s, kind: i === 0 ? 'x' : (v === 2 ? 'closed' : 'open') })
          stems.push({ i, s })
        }
        // Barrado por pulso
        for (let b = 0; b < beatsInMeasure; b++) {
          const bStart = mStart + b * unit
          const beamable = onsets.filter(s => s >= bStart && s < bStart + unit && beamsForDur(dur[s]) >= 1)
          if (beamable.length === 0) continue
          if (beamable.length === 1) {
            flags.push({ i, s: beamable[0], count: beamsForDur(dur[beamable[0]]) })
            continue
          }
          pBeams.push({ i, x1: layout.noteX(beamable[0]) + HEAD_RX, x2: layout.noteX(beamable[beamable.length - 1]) + HEAD_RX })
          // Barra secundaria sólo sobre las semicorcheas (corridas; stub para una suelta)
          if (gridType === 16) {
            let k = 0
            while (k < beamable.length) {
              if (beamsForDur(dur[beamable[k]]) === 2) {
                const runStart = k
                while (k + 1 < beamable.length && beamsForDur(dur[beamable[k + 1]]) === 2) k++
                const xa = layout.noteX(beamable[runStart]) + HEAD_RX
                const xb = layout.noteX(beamable[k]) + HEAD_RX
                if (k > runStart) sBeams.push({ i, x1: xa, x2: xb })
                else if (runStart > 0) sBeams.push({ i, x1: xa - STEP_W * 0.5, x2: xa })
                else sBeams.push({ i, x1: xa, x2: xa + STEP_W * 0.5 })
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
        const x = L.playheadX(f)
        if (playheadRef.current) {
          playheadRef.current.setAttribute('x1', x)
          playheadRef.current.setAttribute('x2', x)
        }
        if (columnRef.current) {
          const step = Math.min(L.grid - 1, Math.floor(pos * L.grid))
          columnRef.current.setAttribute('x', L.cellLeft(step))
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

  const { svgW, svgH, noteX, cellLeft, measureLeft } = layout
  const noteAreaRight = svgW - RIGHT_PAD
  const beats = grid / unit

  // Glifo de silencio (silencio de negra estilizado), centrado en (cx, ly).
  const restGlyph = (cx, ly, key) => (
    <path
      key={key}
      d={`M ${cx - 3} ${ly - 11} q 6 4 1 9 q -6 4 1 9 q 5 3 1 8
          M ${cx - 1.5} ${ly + 6} q -6 1 -2 7 q 5 2 7 -2`}
      fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    />
  )

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
        {/* Columna del paso activo (debajo de todo) */}
        <rect ref={columnRef} x={0} y={TOP_PAD - 6} width={STEP_W} height={svgH - TOP_PAD - BOTTOM_PAD + 12}
          fill="rgba(255,215,0,0.10)" opacity="0" pointerEvents="none" />

        {/* Grilla de pulso tenue + barras de compás */}
        {Array.from({ length: beats + 1 }, (_, b) => {
          const isMeasure = b % (gridType / unit) === 0
          const m = b / (gridType / unit)
          const x = isMeasure ? measureLeft(Math.min(m, measuresSafe)) : cellLeft(b * unit)
          const xx = (isMeasure && m >= measuresSafe) ? noteAreaRight : (isMeasure ? measureLeft(m) : x)
          return (
            <line key={`grid-${b}`} x1={xx} y1={TOP_PAD - 2} x2={xx} y2={svgH - BOTTOM_PAD + 2}
              stroke={isMeasure ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.05)'}
              strokeWidth={isMeasure ? 1.4 : 1} />
          )
        })}
        {/* Barra final doble (fina + gruesa) */}
        <line x1={noteAreaRight - 5} y1={TOP_PAD - 2} x2={noteAreaRight - 5} y2={svgH - BOTTOM_PAD + 2}
          stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <line x1={noteAreaRight} y1={TOP_PAD - 2} x2={noteAreaRight} y2={svgH - BOTTOM_PAD + 2}
          stroke="rgba(255,255,255,0.45)" strokeWidth="2.6" />

        {/* Cifra de compás (una vez, numerales apilados y centrados en el sistema) */}
        {(() => {
          const sigMid = (lineY(0) + lineY(nInst - 1)) / 2
          return (
            <g fill="rgba(255,215,0,0.85)" fontFamily="Georgia, serif" fontSize="21" fontWeight="700" textAnchor="middle">
              <text x={HEAD_X0 - 24} y={sigMid - 5}>{gridType === 12 ? '12' : '4'}</text>
              <text x={HEAD_X0 - 24} y={sigMid + 17}>{gridType === 12 ? '8' : '4'}</text>
            </g>
          )
        })()}

        {/* Llave/bracket que agrupa los 4 pentagramas como UN sistema */}
        <line x1={HEAD_X0 - 56} y1={lineY(0) - 7} x2={HEAD_X0 - 56} y2={lineY(nInst - 1) + 7}
          stroke="rgba(230,230,230,0.55)" strokeWidth="2.4" strokeLinecap="round" />
        {/* Clave neutral de percusión, UNA vez (dos barras), centrada en el sistema */}
        {(() => {
          const mid = (lineY(0) + lineY(nInst - 1)) / 2
          return (
            <g fill="rgba(230,230,230,0.78)">
              <rect x={HEAD_X0 - 49} y={mid - 11} width={2.8} height={22} />
              <rect x={HEAD_X0 - 44} y={mid - 11} width={2.8} height={22} />
            </g>
          )
        })()}
        {/* Por instrumento: etiqueta + línea del pentagrama */}
        {instruments.map((inst, i) => {
          const ly = lineY(i)
          return (
            <g key={`staff-${i}`}>
              <text x={6} y={ly + 4} fontSize="11" fontWeight="700" fill={inst.color}
                fontFamily="'Segoe UI', sans-serif" letterSpacing="0.3">{inst.name}</text>
              <line x1={HEAD_X0 - 8} y1={ly} x2={noteAreaRight} y2={ly} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
            </g>
          )
        })}

        {/* Silencios por pulso vacío */}
        {score.rests.map((r, k) => restGlyph(r.cx, lineY(r.i), `rest-${r.i}-${k}`))}

        {/* Plicas */}
        {score.stems.map(({ i, s }, k) => {
          const x = noteX(s) + HEAD_RX
          const ly = lineY(i)
          return <line key={`stem-${i}-${s}-${k}`} x1={x} y1={ly - 1} x2={x} y2={ly - STEM_LEN}
            stroke={instruments[i].color} strokeWidth="1.6" />
        })}

        {/* Barras primarias (horizontales, por pulso) */}
        {score.pBeams.map((bm, k) => (
          <rect key={`pbeam-${bm.i}-${k}`} x={bm.x1} y={lineY(bm.i) - STEM_LEN}
            width={Math.max(0, bm.x2 - bm.x1)} height={BEAM_H} fill={instruments[bm.i].color} />
        ))}
        {/* Barras secundarias (semicorcheas) y stubs */}
        {score.sBeams.map((bm, k) => (
          <rect key={`sbeam-${bm.i}-${k}`} x={bm.x1} y={lineY(bm.i) - STEM_LEN + BEAM_H + BEAM_GAP}
            width={Math.max(0, bm.x2 - bm.x1)} height={BEAM_H} fill={instruments[bm.i].color} />
        ))}

        {/* Banderas (notas sueltas) */}
        {score.flags.map((fl, k) =>
          flagGlyph(noteX(fl.s) + HEAD_RX, lineY(fl.i) - STEM_LEN, fl.count, instruments[fl.i].color, `flag-${fl.i}-${fl.s}-${k}`)
        )}

        {/* Cabezas de nota. Atabaques: cabeza RELLENA siempre (la duración la dan plica/barra);
            la articulación va en una marca — ○ abierto, + cerrado — como en bronces/hi-hat.
            Así una cabeza con bandera no se contradice con la regla "hueca = blanca/redonda". */}
        {score.heads.map(({ i, s, kind }, k) => {
          const x = noteX(s)
          const ly = lineY(i)
          const color = instruments[i].color
          if (kind === 'x') {
            const d = 5.2
            return (
              <g key={`head-${i}-${s}-${k}`} stroke={color} strokeWidth="2.1" strokeLinecap="round">
                <line x1={x - d} y1={ly - d} x2={x + d} y2={ly + d} />
                <line x1={x + d} y1={ly - d} x2={x - d} y2={ly + d} />
              </g>
            )
          }
          const my = ly + 13   // marca de articulación, debajo de la cabeza (las plicas van arriba)
          return (
            <g key={`head-${i}-${s}-${k}`}>
              <ellipse cx={x} cy={ly} rx={HEAD_RX} ry={HEAD_RY} transform={`rotate(-20 ${x} ${ly})`} fill={color} />
              {kind === 'open'
                ? <circle cx={x} cy={my} r="2.9" fill="none" stroke={color} strokeWidth="1.3" />
                : <g stroke={color} strokeWidth="1.5" strokeLinecap="round">
                    <line x1={x - 3} y1={my} x2={x + 3} y2={my} />
                    <line x1={x} y1={my - 3} x2={x} y2={my + 3} />
                  </g>}
            </g>
          )
        })}

        {/* Playhead continuo (encima de las notas) */}
        <line ref={playheadRef} x1={0} y1={TOP_PAD - 6} x2={0} y2={svgH - BOTTOM_PAD + 6}
          stroke="rgba(255,215,0,0.85)" strokeWidth="1.6" pointerEvents="none" />

        {/* Celdas de click transparentes (edición bidireccional) */}
        {instruments.map((inst, i) =>
          Array.from({ length: grid }, (_, s) => (
            <rect key={`cell-${i}-${s}`} className="ogbon-cell"
              x={cellLeft(s)} y={lineY(i) - 30} width={STEP_W} height={46}
              onClick={() => handleCell(i, s)} />
          ))
        )}

        {/* Leyenda de cabezas y articulaciones */}
        <text x={HEAD_X0 - 56} y={svgH - 10} fontSize="10.5" fill="rgba(255,255,255,0.5)" fontFamily="'Segoe UI', sans-serif">
          × Gã · ○ abierto · + cerrado
        </text>
      </svg>
    </div>
  )
}
