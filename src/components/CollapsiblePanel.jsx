import { useState } from 'react'

/**
 * Panel desplegable reutilizable (estética dorada-oscura). Envuelve <details>/<summary>
 * nativos → accesible por teclado y con semántica correcta sin esfuerzo extra.
 * Reduce el ruido visual: cada bloque secundario se colapsa y deja el círculo + el
 * ecualizador como protagonistas. Cerrado por defecto (salvo `defaultOpen`).
 *
 * El estado abierto/cerrado se maneja internamente y se sincroniza con `onToggle`:
 * así un re-render del padre (p. ej. al togglear un golpe) no lo cierra de golpe.
 *
 * `title` puede ser texto o JSX (p. ej. el nombre del orixá del toque activo).
 */
export default function CollapsiblePanel({ title, children, maxWidthClass = 'max-w-2xl', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details
      open={open}
      onToggle={e => setOpen(e.currentTarget.open)}
      className={`w-full ${maxWidthClass} bg-[#1e1e1e] rounded-xl px-3 py-2.5 mb-3 text-sm`}
    >
      <summary className="cursor-pointer text-[var(--gold)] font-semibold select-none">
        {title}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}
