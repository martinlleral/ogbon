/**
 * Toast no-bloqueante. Aparece justo encima de la barra de transporte y
 * desaparece solo (el temporizador vive en useToast).
 * `toast.type`: 'success' | 'error' | 'info' → color del acento.
 */
export default function Toast({ toast }) {
  if (!toast) return null

  const accent = {
    success: 'border-[var(--gold)] text-[var(--gold)]',
    error: 'border-[#e74c3c] text-[#e74c3c]',
    info: 'border-[#666] text-white'
  }[toast.type] || 'border-[#666] text-white'

  return (
    <div
      className="fixed left-0 right-0 z-[90] flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 92px)' }}
    >
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        className={`bg-[#1e1e1e]/95 backdrop-blur border ${accent} rounded-full px-4 py-2 text-sm shadow-lg animate-[ogbon-toast-in_0.25s_ease-out]`}
      >
        {toast.message}
      </div>
    </div>
  )
}
