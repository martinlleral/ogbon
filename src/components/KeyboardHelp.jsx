import CollapsiblePanel from './CollapsiblePanel'

/**
 * Atajos de teclado del secuenciador + toggle del modo Práctica (sonar al navegar).
 * Visible para todos → hace descubrible la navegación por teclado, no solo para quien
 * usa lector de pantalla. Se apoya en CollapsiblePanel para un estilo coherente.
 */
const SHORTCUTS = [
  ['← →', 'Tiempo anterior / siguiente'],
  ['↑ ↓', 'Cambiar de anillo (instrumento)'],
  ['1 – 4', 'Ir a Gã / Rum / Rumpi / Lé'],
  ['Espacio / Enter', 'Poner o sacar un golpe'],
  ['Inicio / Fin', 'Primer / último tiempo']
]

// Atajos del Modo Toque (grabar tocando)
const REC_SHORTCUTS = [
  ['R', 'Entrar o salir del Modo Toque'],
  ['Espacio', 'Tocar un golpe (cae cuantizado)'],
  ['1 – 4', 'Elegir el anillo a grabar'],
  ['C', 'Golpe abierto / cerrado'],
  ['Retroceso', 'Deshacer el último golpe'],
  ['Esc', 'Salir del Modo Toque']
]

export default function KeyboardHelp({ practiceMode, onTogglePractice, metricGuide, onToggleMetricGuide, recordMode, onToggleRecord }) {
  return (
    <CollapsiblePanel title="⌨ Tocar con el teclado">
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={onTogglePractice}
            className="accent-[var(--gold)] w-4 h-4"
          />
          <span>🔊 Sonar al navegar <span className="opacity-60">(modo Práctica)</span></span>
        </label>
        <label className={`flex items-center gap-2 w-fit ${recordMode ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={metricGuide}
            onChange={onToggleMetricGuide}
            disabled={recordMode}
            className="accent-[var(--gold)] w-4 h-4"
          />
          <span>🧭 Guía métrica <span className="opacity-60">{recordMode ? '(activa durante el Modo Toque)' : '(marca pulsos y compases; claqueta al reproducir)'}</span></span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={recordMode}
            onChange={onToggleRecord}
            className="accent-[var(--gold)] w-4 h-4"
          />
          <span>🥁 Modo Toque <span className="opacity-60">(tocá el ritmo y cae en su lugar)</span></span>
        </label>
        <p className="opacity-50 text-xs leading-snug -mt-1">
          Elegís tempo y compás arriba; tocás con la barra espaciadora o el botón <strong>TAP</strong> y
          cada golpe se acomoda a la casilla más cercana. No detecta el tempo ni la métrica por vos:
          no es “decí el ritmo y sale perfecto” —eso todavía no es realista offline— es “tocá el ritmo
          y lo escribimos derecho”. Si te cuesta el pulso, bajá el tempo para tocar y subilo después.
        </p>
        <table className="w-full text-left">
          <tbody>
            {SHORTCUTS.map(([k, d]) => (
              <tr key={k} className="border-t border-[#333]">
                <td className="py-1.5 pr-3 font-mono text-[var(--gold)] whitespace-nowrap align-top">{k}</td>
                <td className="py-1.5 opacity-80">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="opacity-50 text-xs leading-snug">
          Hacé foco en el <strong>editor del ritmo</strong> con Tab (es una grilla accesible
          para lector de pantalla) y movéte con las flechas; el cursor dorado aparece en el
          círculo. Inspirado en el patrón “Non-Visual Beats” (NYU + Ability Project).
        </p>
        <p className="text-[11px] uppercase tracking-widest opacity-50 mt-1">En Modo Toque 🥁</p>
        <table className="w-full text-left">
          <tbody>
            {REC_SHORTCUTS.map(([k, d]) => (
              <tr key={k} className="border-t border-[#333]">
                <td className="py-1.5 pr-3 font-mono text-[var(--gold)] whitespace-nowrap align-top">{k}</td>
                <td className="py-1.5 opacity-80">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsiblePanel>
  )
}
