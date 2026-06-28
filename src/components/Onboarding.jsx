/**
 * Hint de primer uso: aparece una sola vez (flag en localStorage, manejado
 * por el componente padre) y se va al tocar un círculo o al cerrarlo.
 * Da el primer paso claro sin tutorial pesado: tocar → reproducir.
 */
export default function Onboarding({ onDismiss }) {
  return (
    <div className="w-full max-w-2xl mb-3 animate-[ogbon-fade-in_0.4s_ease-out]">
      <div className="flex items-center gap-3 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-xl px-4 py-2.5 text-sm">
        <span className="text-lg" aria-hidden="true">👇</span>
        <p className="flex-1 opacity-90 leading-snug">
          <span className="text-[var(--gold)] font-semibold">Tocá un círculo</span> para
          colocar un golpe y armar tu ritmo. Después dale ▶ abajo.
        </p>
        <button
          onClick={onDismiss}
          aria-label="Entendido, cerrar la ayuda"
          className="text-white/50 hover:text-white text-xl leading-none px-1 shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  )
}
