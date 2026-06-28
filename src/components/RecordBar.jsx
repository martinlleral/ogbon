import { useRef, useEffect } from 'react'

/**
 * RecordBar — la barra del "Modo Toque" (tap-to-circle). Aparece SOBRE el transporte fijo
 * sólo mientras se graba. Tocás con la barra espaciadora o el botón TAP y cada golpe cae
 * cuantizado a la casilla más cercana del anillo activo (la cuantización vive en el motor,
 * `tapToStep`; el ruteo y el estado en Ogbon.jsx). Es la puerta de accesibilidad de Ogbón:
 * crear un ritmo sin navegar la grilla visual (patrón QWERTYBeats / Non-Visual Beats, NYU).
 *
 * Sin estado propio: todo entra por props. El input táctil usa onPointerDown (dispara en el
 * contacto, no espera al pointerup) y el teclado entra por el listener global de Ogbon
 * (Espacio) y por Enter sobre el botón TAP (ruta alterna para lectores que interceptan Espacio).
 */
export default function RecordBar({ instruments, recInst, closedMode, countingIn, onTap, onChangeInst, onToggleClosed, onUndo, onClear, onExit }) {
  const tapRef = useRef(null)
  // Al abrir, el foco va al botón TAP: un lector de pantalla aterriza listo para tocar.
  useEffect(() => { tapRef.current?.focus() }, [])

  const inst = instruments[recInst]

  return (
    <div className="border-b border-[#444] px-3 py-2.5 flex flex-col gap-2 items-center" role="group" aria-label="Modo Toque">
      <p className="sr-only">
        Modo Toque. Atajos: Espacio o el botón TAP para tocar un golpe; teclas 1 a 4 para elegir el anillo;
        C para alternar abierto y cerrado; Retroceso para deshacer; Escape para salir.
      </p>
      {/* Estado + selector rápido de anillo */}
      <div className="flex items-center justify-between w-full max-w-2xl gap-2">
        <span className="text-sm font-bold flex items-center gap-1.5 whitespace-nowrap" style={{ color: inst.color }}>
          <span aria-hidden="true" className={countingIn ? 'opacity-40' : 'opacity-100'}>●</span>
          {countingIn ? 'Entrada…' : 'Grabando'} · {inst.name}
        </span>
        <div className="flex gap-1.5 items-center">
          {instruments.map((ins, i) => (
            <button
              key={ins.name}
              type="button"
              onClick={() => onChangeInst(i)}
              aria-label={`Grabar en ${ins.name}`}
              aria-pressed={i === recInst}
              aria-keyshortcuts={`${i + 1}`}
              title={ins.name}
              className={`w-7 h-7 rounded-full text-[11px] font-bold transition-all ${i === recInst ? 'border-2' : 'border border-[#555] opacity-55 hover:opacity-90'}`}
              style={{ borderColor: i === recInst ? ins.color : undefined, color: ins.color }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Botón TAP grande + acciones secundarias */}
      <div className="flex items-stretch gap-3 w-full max-w-2xl">
        <button
          ref={tapRef}
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onTap() }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onTap() } }}
          aria-label={`Tocar golpe de ${inst.name}`}
          aria-keyshortcuts="Space"
          className="ogbon-tap flex-1 h-16 rounded-xl text-2xl font-extrabold tracking-[0.3em] bg-[var(--gold)] text-black"
          style={{ touchAction: 'manipulation' }}
        >
          TAP
        </button>
        <div className="flex flex-col gap-1.5 shrink-0">
          {recInst !== 0 && (
            <button
              type="button"
              onClick={onToggleClosed}
              aria-label="Tipo de golpe: abierto o cerrado (los atabaques; el Gã siempre abre)"
              aria-keyshortcuts="C"
              className="px-3 py-1 rounded border border-[#555] text-xs hover:bg-[var(--gold)] hover:text-black transition-colors min-w-[92px]"
            >
              {closedMode ? '+ Cerrado' : '○ Abierto'}
            </button>
          )}
          <button
            type="button"
            onClick={onUndo}
            aria-label="Deshacer el último golpe"
            aria-keyshortcuts="Backspace"
            className="px-3 py-1 rounded border border-[#555] text-xs hover:bg-[var(--gold)] hover:text-black transition-colors min-w-[92px]"
          >
            ↶ Deshacer
          </button>
        </div>
      </div>

      {/* Acciones de cierre */}
      <div className="flex gap-4 text-xs opacity-75">
        <button type="button" onClick={onClear} aria-label={`Vaciar todos los golpes de ${inst.name}`} className="hover:text-[var(--gold)] transition-colors">
          Vaciar {inst.name}
        </button>
        <button type="button" onClick={onExit} aria-label="Salir del Modo Toque" aria-keyshortcuts="Escape" className="hover:text-[var(--gold)] transition-colors">
          ■ Salir
        </button>
      </div>
    </div>
  )
}
