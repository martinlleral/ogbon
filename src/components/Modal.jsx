import { useEffect, useRef } from 'react'

/**
 * Modal reutilizable en la estética dorada-oscura de Ogbón.
 * Cubre dos usos según `state.type`:
 *  - 'prompt'  → campo de texto; resuelve con el texto escrito (o null si se cancela).
 *  - 'confirm' → mensaje de sí/no; resuelve con true / false.
 *
 * Accesible: role="dialog", foco automático al abrir, Escape cancela,
 * Enter confirma, click en el fondo cancela. El input es no-controlado
 * (defaultValue + ref) para no sincronizar estado dentro de un efecto.
 */
export default function Modal({ state, onClose }) {
  const inputRef = useRef(null)
  const confirmBtnRef = useRef(null)

  const isPrompt = state?.type === 'prompt'

  // Al abrir: mover el foco al campo (prompt) o al botón de confirmar (confirm).
  useEffect(() => {
    if (!state) return
    const id = setTimeout(() => {
      if (state.type === 'prompt') inputRef.current?.select()
      else confirmBtnRef.current?.focus()
    }, 60)
    return () => clearTimeout(id)
  }, [state])

  // Escape cancela; Enter confirma una confirmación (en prompt lo maneja el input).
  useEffect(() => {
    if (!state) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(state.type === 'prompt' ? null : false)
      else if (e.key === 'Enter' && state.type === 'confirm') onClose(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, onClose])

  if (!state) return null

  const confirm = () => {
    if (isPrompt) {
      const v = (inputRef.current?.value || '').trim()
      onClose(v || null)
    } else {
      onClose(true)
    }
  }
  const cancel = () => onClose(isPrompt ? null : false)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-[ogbon-fade-in_0.15s_ease-out]"
      onClick={cancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={state.title || 'Diálogo'}
        className="w-full max-w-sm bg-[#1e1e1e] border border-[#444] rounded-2xl shadow-2xl p-5 animate-[ogbon-pop-in_0.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        {state.title && (
          <h2 className="text-[var(--gold)] text-lg font-semibold mb-1">{state.title}</h2>
        )}
        {state.message && (
          <p className="text-sm opacity-80 leading-snug mb-4 whitespace-pre-line">{state.message}</p>
        )}

        {isPrompt && (
          <input
            key={state.openId}
            ref={inputRef}
            type="text"
            defaultValue={state.defaultValue || ''}
            onKeyDown={(e) => { if (e.key === 'Enter') confirm() }}
            placeholder={state.placeholder || ''}
            maxLength={40}
            className="w-full bg-[#121212] text-white border border-[#555] rounded-lg px-3 py-2 mb-4 outline-none focus:border-[var(--gold)] transition-colors"
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={cancel}
            className="px-4 py-2 rounded-lg border border-[#555] text-white/80 hover:bg-[#333] transition-colors"
          >
            {state.cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={confirm}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              state.danger
                ? 'bg-[#e74c3c] text-white hover:bg-[#c0392b]'
                : 'bg-[var(--gold)] text-black hover:brightness-110'
            }`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
