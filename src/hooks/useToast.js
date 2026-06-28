import { useState, useRef, useCallback } from 'react'

/**
 * Avisos no-bloqueantes (toasts): aparecen abajo y se van solos.
 * Reemplazan a alert() — no interrumpen ni exigen un click.
 *   showToast('Guardado ✓', 'success')   // 'success' | 'error' | 'info'
 */
export function useToast(duration = 2600) {
  const [toast, setToast] = useState(null) // { id, message, type } | null
  const timerRef = useRef(null)
  const idRef = useRef(0)

  const showToast = useCallback((message, type = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    idRef.current += 1
    setToast({ id: idRef.current, message, type })
    timerRef.current = setTimeout(() => setToast(null), duration)
  }, [duration])

  return { toast, showToast }
}
