import { useEffect, useRef } from 'react'

/**
 * Mantiene la pantalla encendida mientras `active` sea true (Screen Wake Lock API).
 * Útil para que el celular no se apague mientras suena un ritmo.
 * Degrada en silencio si el navegador no la soporta, la rechaza (batería baja) o
 * no estamos en un contexto seguro (HTTPS). El lock se suelta solo al pasar la
 * pestaña a segundo plano, así que se re-adquiere al volver a estar visible.
 */
export function useWakeLock(active) {
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let released = false
    const acquire = async () => {
      try {
        sentinelRef.current = await navigator.wakeLock.request('screen')
      } catch {
        /* permiso denegado / batería baja: no es crítico */
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibility)
      const s = sentinelRef.current
      sentinelRef.current = null
      if (s) s.release().catch(() => {})
    }
  }, [active])
}
