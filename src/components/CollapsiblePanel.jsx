/**
 * Panel desplegable reutilizable (estética dorada-oscura). Envuelve <details>/<summary>
 * nativos → accesible por teclado y con semántica correcta sin esfuerzo extra.
 * Reduce el ruido visual: cada bloque secundario se colapsa y deja el círculo + el
 * ecualizador como protagonistas. Cerrado por defecto.
 *
 * `title` puede ser texto o JSX (p. ej. el nombre del orixá del toque activo).
 */
export default function CollapsiblePanel({ title, children, maxWidthClass = 'max-w-2xl' }) {
  return (
    <details className={`w-full ${maxWidthClass} bg-[#1e1e1e] rounded-xl px-3 py-2.5 mb-3 text-sm`}>
      <summary className="cursor-pointer text-[var(--gold)] font-semibold select-none">
        {title}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}
