/**
 * Registro del Service Worker (PWA) con actualizaciones CONFIABLES.
 *
 * Problema que resuelve: GitHub Pages sirve `sw.js` con `Cache-Control: max-age=600`, y Chrome
 * respeta ese caché para el chequeo de actualización del SW — así que el navegador no ve el SW
 * nuevo hasta que vencen 10 minutos, y recargar no alcanza.
 *
 * Solución: registramos con `updateViaCache: 'none'` (el navegador busca `sw.js` SIN pasar por el
 * caché HTTP), chequeamos updates cada minuto y al volver a foco. Como con registro propio el SW
 * NO se auto-activa (espera un mensaje `SKIP_WAITING` y no hace clientsClaim), nosotros decidimos
 * CUÁNDO aplicar: si la app NO está reproduciendo, aplicamos solos; si está reproduciendo, avisamos
 * con un botón "actualizar" y aplicamos cuando el usuario quiera o cuando pare. Aplicar = mandar
 * SKIP_WAITING al SW que espera y recargar la página. Si el registro falla (dev sin SW), la app
 * funciona igual sin PWA.
 */
let reg = null
let refreshing = false   // ya estamos recargando: no dispares dos veces
let wantReload = false   // pedimos una actualización: recarga al haber controllerchange
let pending = false      // hay una versión nueva esperando a que dejemos de estar ocupados
let busy = false         // la app está reproduciendo: no aplicar de sorpresa
let updateReadyCb = null // callback para que la UI muestre el botón "actualizar"

function reloadOnce() {
  if (refreshing) return
  refreshing = true
  window.location.reload()
}

// Aplica la versión nueva: el SW que espera hace skipWaiting; recargamos para tomarla.
function applyUpdate() {
  if (refreshing) return
  // Loop-breaker: si recién recargamos por un update (<15s) y volvemos a estar acá (p. ej. un SW
  // que no termina de activar), NO recargues en bucle: mostrá el botón y que el usuario decida.
  const now = Date.now()
  let last = 0
  try { last = +(sessionStorage.getItem('ogbon_sw_reload') || 0) } catch { /* sin sessionStorage */ }
  if (now - last < 15000) { pending = true; updateReadyCb?.(); return }
  try { sessionStorage.setItem('ogbon_sw_reload', String(now)) } catch { /* sin sessionStorage */ }
  wantReload = true
  const waiting = reg && reg.waiting
  if (waiting) {
    waiting.postMessage({ type: 'SKIP_WAITING' })
    // Sin clientsClaim no siempre hay controllerchange: fallback que recarga igual.
    setTimeout(reloadOnce, 1200)
  } else {
    reloadOnce()
  }
}

function onNewVersion() {
  if (busy) { pending = true; updateReadyCb?.(); return }
  applyUpdate()
}

// La UI marca "ocupado" mientras reproduce, para no recargar en medio de un ritmo.
export function setBusy(v) {
  busy = !!v
  if (!busy && pending) applyUpdate()
}

// La UI registra un callback para mostrar el aviso de "nueva versión".
export function onUpdateReady(cb) {
  updateReadyCb = cb
  if (pending) cb?.()
}

// El botón "actualizar" de la UI.
export function applyUpdateNow() { applyUpdate() }

export function setupPWA() {
  if (!('serviceWorker' in navigator)) return
  // En dev no hay sw.js (vite-plugin-pwa no lo genera): registrar daría un error de MIME del
  // fallback SPA. El SW solo aplica al build de producción.
  if (!import.meta.env.PROD) return
  // Recargar SOLO cuando nosotros pedimos la actualización (evita recargas espurias).
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload) reloadOnce() })
  window.addEventListener('load', async () => {
    try {
      reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
    } catch {
      return // sin SW (dev, o navegador sin soporte): la app sigue funcionando
    }
    // ¿Ya había una versión esperando —o instalándose— de una sesión anterior?
    if (reg.waiting && navigator.serviceWorker.controller) onNewVersion()
    if (reg.installing && navigator.serviceWorker.controller) {
      const sw = reg.installing
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) onNewVersion()
      })
    }
    // Nueva versión que termina de instalarse mientras YA hay un SW controlando = actualización
    // (en la primera visita no hay controller, así que no recargamos).
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing
      if (!sw) return
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) onNewVersion()
      })
    })
    // Chequear updates seguido (bypassando el caché de sw.js) + al volver a foco. Re-evaluar un
    // 'waiting' ya presente cubre la carrera de instalarse antes de enganchar el listener.
    const maybeWaiting = () => { if (reg.waiting && navigator.serviceWorker.controller) onNewVersion() }
    const check = () => reg.update().then(maybeWaiting).catch(() => {})
    setInterval(check, 60_000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  })
}
