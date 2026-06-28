# Changelog — Ogbón

Mapa de versiones del proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com).

## [2.8.0] — 2026-06-28 · "Accesible"

Cuarta iteración: el secuenciador se puede tocar **sin mouse, sin tacto y sin ver**.

### Added
- **Navegación por teclado completa** del círculo (patrón "Non-Visual Beats", NYU +
  Ability Project): flechas para moverse entre tiempos (←/→) y anillos (↑/↓), teclas
  **1-4** por instrumento, **Espacio/Enter** para poner o sacar un golpe, Inicio/Fin.
  Foco visible (anillo dorado) + cursor punteado en la celda activa.
- **Lectura para lector de pantalla**: una región ARIA-live anuncia *"Rum · tiempo 3 de
  16 · abierto"* en cada movimiento (el canvas es `role="application"`).
- **Modo Práctica**: al navegar, suena el golpe de la celda para ubicarse sin ver (toggle,
  activado por defecto).
- **Panel de atajos** (⌨) desplegable: hace descubrible la navegación por teclado para todos.
- Documento de decisiones de diseño: [`docs/ACCESIBILIDAD.md`](docs/ACCESIBILIDAD.md).

### Changed
- **Menos ruido visual** (accesibilidad cognitiva): el contexto cultural (orixá), los
  efectos visuales (neón / haces / anillos) y las ondas pasan a **paneles desplegables**
  con el mismo estilo que el de teclado. El **ecualizador sube** y queda pegado al círculo.
- **Sumar compases ahora DUPLICA el ritmo** escrito (repetición cíclica) en vez de
  borrarlo; quitar compases lo trunca al primer compás.

### Fixed
- Al cambiar de compás o de grilla **mientras sonaba**, el motor podía seguir sonando con
  el botón en ▶. Ahora la reproducción se detiene de forma consistente.

---

## [2.7.0] — 2026-06-27 · "Comodidad"

Tercera iteración: se pulen los detalles de uso para que la app se sienta cuidada.

### Added
- **Diálogos propios** en la estética dorada-oscura, en vez de los `prompt`/`confirm`/
  `alert` nativos del navegador (que rompían la inmersión y se ven distinto en cada SO).
  Guardar y Exportar abren un **modal con campo de texto**; Eliminar pide **confirmación**
  con botón rojo de "peligro".
- **Avisos no-bloqueantes (toasts)**: feedback de "Guardado ✓", "Eliminado", "Ritmo
  importado" y errores, que aparecen abajo y se van solos sin frenar la interacción.
- **Hint de primer uso**: la primera vez aparece "tocá un círculo para armar tu ritmo"
  (se recuerda en `localStorage`, no vuelve a molestar).
- **Accesibilidad**: los modales se manejan con teclado (Escape cancela, Enter confirma,
  foco automático) y se respeta `prefers-reduced-motion` para quien pide menos animación.

### Fixed
- Importar un `.ogbon` con JSON corrupto ahora muestra un aviso claro en vez de fallar
  en silencio (la promesa rechazada no se manejaba).

---

## [2.6.0] — 2026-06-27 · "Móvil de verdad"

Segunda iteración: la app se vuelve instalable y cómoda en el celular.

### Added
- **PWA instalable**: manifest + service worker (offline, precache de ~223 KB) +
  íconos on-brand (192/512/maskable + apple-touch).
- **Screen Wake Lock**: la pantalla no se apaga mientras suena un ritmo.

### Changed
- **Rediseño responsive móvil**: el transporte (PLAY + BPM) pasa a una **barra fija
  inferior** siempre accesible con el pulgar; el **círculo protagoniza** (sube en la
  página); los controles se agrupan por jerarquía (patrón → presets → secundarios).
- **Viewport**: se permite pinch-zoom (accesibilidad) y se evita el zoom por doble-tap
  accidental (`touch-action`); `viewport-fit=cover` para PWA a pantalla completa.

### Fixed
- Overflow horizontal en móvil (botones que se cortaban del viewport).

---

## [2.5.0] — 2026-06-27 · "Cimientos"

Primera iteración tras retomar el proyecto. Revisión técnica, research multiagente
(ver `docs/RESEARCH.md`) y base sólida para iterar.

### Added
- **Toques built-in con contexto cultural**: Ijexá (Oxum), Aguerê (Oxóssi) y Vassi
  (linha-guia colectiva), cada uno con su fuente etnomusicológica y nivel de confianza.
  El **ijexá se carga al abrir** la app (antes abría muda).
- **Panel de contexto cultural** por toque (orixá, descripción, fuente, confianza) +
  subtítulo de encuadre. Ver `docs/VALIDACION-CULTURAL.md`.
- **Nitidez en pantallas retina/móvil**: ambos canvas dibujan con `devicePixelRatio`.
- **Lint en CI** (GitHub Actions) para que no se acumulen errores.
- Documentación: `docs/RESEARCH.md`, `docs/VALIDACION-CULTURAL.md`, este `CHANGELOG.md`.

### Fixed
- **"Haces de Luz" rotos**: la antigüedad de cada golpe se medía mezclando dos relojes
  incompatibles (`Date.now()` vs el del `AudioContext`). Ahora usa el reloj del audio.
- **Fidelidad de presets**: un ritmo 12/8 podía recargarse mal interpretado como 4/4
  (ambos dan 48 pasos). El formato v2 guarda `gridType` y `measures` explícitos.
- **Hit-testing táctil/click** correcto con el canvas escalado por DPR (coords lógicas).
- 41 errores de lint (bloques `catch` vacíos, variables muertas).

### Changed
- **Presets sin backend**: se elimina Supabase (el proyecto en la nube fue dado de baja).
  Modelo nuevo: built-in + `localStorage` + import/export de archivos `.ogbon`. **100% offline.**
- Scheduler de audio alineado al estándar look-ahead de Chris Wilson (25 / 100 ms).
- **Bundle JS: 395 KB → 214 KB** (114 → 68 KB gzip) al quitar el cliente de Supabase.

### Removed
- Dependencia `@supabase/supabase-js` y los secrets de Supabase en CI.

---

## [2.1.0 – 2.4.0] — 2026-03-28

- Credenciales Supabase movidas a `.env` + secrets en GitHub Actions.
- Eliminados los presets internos (Kabila, Ijexá) que vivían en la nube.
- `.env` agregado al `.gitignore`.

## [2.0.0] — 2026-03-24 · "React/Vite"

- **Refactor mayor**: del `index.html` monolítico a **React 19 + Vite 8 + Tailwind CSS 4**,
  con código modular (`audio/engine`, `audio/presets`, `components/`).

## [1.0.0 – 1.1.0] — 2026-03-23 · "Círculos de Axé"

- Primer commit: `index.html` único (1381 líneas) con Web Audio API + Canvas 2D + Supabase.
- Deploy automático a GitHub Pages vía GitHub Actions.

[2.8.0]: https://github.com/martinlleral/ogbon/releases/tag/v2.8.0
[2.7.0]: https://github.com/martinlleral/ogbon/releases/tag/v2.7.0
[2.6.0]: https://github.com/martinlleral/ogbon/releases/tag/v2.6.0
[2.5.0]: https://github.com/martinlleral/ogbon/releases/tag/v2.5.0
