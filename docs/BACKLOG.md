# Backlog — Ogbón

Ideas y mejoras pendientes de evaluar/priorizar. No es un compromiso; es el "compost"
de donde salen las próximas iteraciones.

## Estado del proyecto (al 2026-06-28)

- **En vivo:** https://martinlleral.github.io/ogbon/ (PWA instalable)
- **Versión:** v2.8.0 · ver `../CHANGELOG.md` para el mapa de versiones completo
- ✅ **Iteración 1 (v2.5.0) — Cimientos:** fix Haces + fidelidad de presets, nitidez
  retina, sin Supabase (offline), 3 toques con fuentes, ijexá al abrir.
- ✅ **Iteración 2 (v2.6.0) — Móvil:** PWA instalable + offline, Screen Wake Lock,
  rediseño con transporte fijo abajo + círculo protagonista.
- ✅ **Iteración 3 (v2.7.0) — Comodidad:** diálogos propios (modal input/confirm +
  toasts) en vez de prompt/confirm/alert; hint de primer uso (localStorage);
  accesibilidad en modales (teclado + prefers-reduced-motion); emoji 🥁→🪘; fix
  import .ogbon corrupto.
- ✅ **Iteración 4 (v2.8.0) — Accesible:** navegación por teclado del secuenciador
  (patrón Non-Visual Beats), modo Práctica, foco visible + ARIA-live (ver
  `ACCESIBILIDAD.md`); UI con menos ruido (paneles desplegables, ecualizador pegado al
  círculo); fix: sumar compases DUPLICA el ritmo en vez de borrarlo.

## ▶️ Próxima iteración: 5 — a elegir con Martín

Candidatas (ver "Pendientes" abajo para el detalle):
- 🎼 **Notación musical convencional** entre el círculo y las ondas (spike primero).
- 🌊 **Evaluar las ondas** (paralelas vs transcendental): rol, potencial, si se mantienen.
- 🤝 **Validación cultural** (arrancar contactos).
- ♿ **Accesibilidad nivel 2**: DOM accesible paralelo + pruebas con usuarios reales.
- 🔧 Infra menor: CI `node-version` 20 → 24.

## Pendientes (evaluar/priorizar)

### 🎼 Vista de notación musical convencional
**Qué:** representar el ritmo en **notación musical convencional** (partitura de
percusión), **entre el círculo y las ondas**. Tres lecturas del mismo ritmo.
**A evaluar:** notación de percusión 4 voces (cabezas open/closed), 12/8 y 4/4,
sincronizar playhead, **VexFlow** vs **abcjs** vs render propio SVG. Empezar por un spike.
**Dependencia cultural:** validar la notación con la comunidad (ver `VALIDACION-CULTURAL.md`).
**Origen:** pedido de Martín, 2026-06-27.

### ♿ Accesibilidad nivel 2 (sobre lo hecho en v2.8.0)
Ya **HECHO** en v2.8.0: navegación por teclado del secuenciador + modo Práctica +
región ARIA-live (ver `ACCESIBILIDAD.md`). Falta el **nivel 2**: DOM accesible paralelo
(un elemento por celda, `role="gridcell"`/`aria-pressed`) para exploración libre con
lector de pantalla; más modos de audio (sonificación de la estructura métrica); y
**pruebas con usuarios reales** de VoiceOver / NVDA. Fuente en `RESEARCH.md`.

### 🤝 Validación cultural
Arrancar los contactos del plan (`VALIDACION-CULTURAL.md`): etnomusicólogo / comunidad,
para validar los toques antes de sumar más presets.

### 🌊 Visualizaciones de onda — función y potencial
**Qué:** evaluar qué aportan realmente las dos vistas ("Ondas Paralelas" y "Onda
Transcendental") y qué potencial tienen. ¿Son decorativas, pedagógicas, o feedback de
performance? ¿Conviene quedarse con una, fusionarlas, o darles un rol claro (mostrar
acentos, analizar el ritmo, ayudar a afinar el mixer)? Hoy quedaron **colapsadas** para
bajar el ruido visual; falta decidir su rol, su nombre y si se mantienen ambas.
**Origen:** Martín, 2026-06-28.

### 🔧 Infra menor
- CI: subir `node-version` de 20 → 24 en `deploy.yml` (warning de deprecación en Actions).

## Ideas sueltas (sin desarrollar)
- Botón "generá una variación" con ritmos euclidianos (Bjorklund).
- Más toques built-in (avamunha, barravento) una vez validados.
- Compartir un ritmo por link (estado codificado en la URL, sin backend).
