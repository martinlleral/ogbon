import { useState, useRef } from 'react'
import { nextStepValue, stateLabel, readCell } from '../audio/steps'

/**
 * AccessibleGrid — la superficie ACCESIBLE del secuenciador (DOM real, no canvas).
 *
 * El círculo y la partitura son representaciones VISUALES del mismo `steps`; esta grilla
 * es la representación para teclado + lector de pantalla: un `role="grid"` con una celda
 * (botón) por golpe, etiquetada ("Rum, tiempo 3 de 16: abierto"), navegable con flechas
 * (roving tabindex) y editable con Enter/Espacio. Visualmente oculta (`sr-only`) pero
 * presente en el árbol de accesibilidad. Reemplaza el hack de `role="application"` sobre
 * el canvas (cuyo soporte en lectores de pantalla es irregular).
 *
 * Al enfocar/mover reporta la celda activa con `onCursor` para que el CÍRCULO dibuje su
 * cursor ahí (feedback visual para quien navega con teclado y ve). En modo Práctica, suena
 * el golpe de la celda al navegar.
 *
 * (Handlers como funciones planas a propósito: la grilla re-renderiza sólo en interacción,
 * no por frame, así que memoizar no aporta — y leer `engine.current` en un useCallback
 * choca con la regla del React Compiler.)
 */
export default function AccessibleGrid({ instruments, steps, grid, engine, onStepToggle, onCursor, practiceMode }) {
  const [cursor, setCursor] = useState({ i: 0, s: 0 })
  const [announce, setAnnounce] = useState('')
  const btnRefs = useRef(new Map())
  const nInst = instruments.length

  const labelFor = (i, s) =>
    `${instruments[i].name}, tiempo ${s + 1} de ${grid}: ${stateLabel(readCell(steps, i, s), i)}`

  const move = (i, s, preview) => {
    setCursor({ i, s })
    onCursor?.({ i, s })
    btnRefs.current.get(`${i}-${s}`)?.focus()
    if (preview && practiceMode) engine?.current?.previewHit(i, readCell(steps, i, s))
  }

  const toggle = (i, s) => {
    onStepToggle(i, s)
    const newVal = nextStepValue(readCell(steps, i, s), i)
    setAnnounce(`${instruments[i].name}, tiempo ${s + 1}: ${stateLabel(newVal, i)}`)
    if (practiceMode) engine?.current?.previewHit(i, newVal)
  }

  const onKey = (e, i, s) => {
    let ni = i, ns = s, handled = true
    switch (e.key) {
      case 'ArrowRight': ns = (s + 1) % grid; break
      case 'ArrowLeft': ns = (s - 1 + grid) % grid; break
      case 'ArrowDown': ni = Math.min(nInst - 1, i + 1); break
      case 'ArrowUp': ni = Math.max(0, i - 1); break
      case 'Home': ns = 0; break
      case 'End': ns = grid - 1; break
      case '1': case '2': case '3': case '4': { const idx = parseInt(e.key) - 1; if (idx < nInst) ni = idx; break }
      case 'Enter': case ' ': e.preventDefault(); toggle(i, s); return
      default: handled = false
    }
    if (!handled) return
    e.preventDefault()
    move(ni, ns, true)
  }

  const onContainerBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onCursor?.(null)
  }

  // Clampea el cursor en el render (sin setState-en-effect): un cambio de grilla nunca
  // deja la grilla sin celda tabulable.
  const curI = Math.min(cursor.i, nInst - 1)
  const curS = Math.min(cursor.s, grid - 1)

  return (
    <div className="sr-only" onBlur={onContainerBlur}>
      <div role="grid" aria-label={`Editor del ritmo, ${nInst} instrumentos por ${grid} tiempos. Flechas para moverte, Enter o Espacio para poner o sacar un golpe.`}>
        {instruments.map((inst, i) => (
          <div role="row" key={inst.name}>
            <span role="rowheader">{inst.name}</span>
            {Array.from({ length: grid }, (_, s) => (
              <button
                key={s}
                role="gridcell"
                type="button"
                ref={el => { if (el) btnRefs.current.set(`${i}-${s}`, el); else btnRefs.current.delete(`${i}-${s}`) }}
                tabIndex={curI === i && curS === s ? 0 : -1}
                aria-label={labelFor(i, s)}
                onClick={() => { setCursor({ i, s }); onCursor?.({ i, s }); toggle(i, s) }}
                onFocus={() => { setCursor({ i, s }); onCursor?.({ i, s }) }}
                onKeyDown={e => onKey(e, i, s)}
              />
            ))}
          </div>
        ))}
      </div>
      <div role="status" aria-live="polite">{announce}</div>
    </div>
  )
}
