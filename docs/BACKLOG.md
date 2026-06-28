# Backlog — Ogbón

Ideas y mejoras pendientes de evaluar/priorizar. No es un compromiso; es el "compost"
de donde salen las próximas iteraciones.

## Estado del proyecto (al 2026-06-28)

- **En vivo:** https://martinlleral.github.io/ogbon/ (PWA instalable)
- **Versión:** v2.9.0 · ver `../CHANGELOG.md` para el mapa de versiones completo
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
- ✅ **Iteración 5 (v2.9.0) — Tres lecturas:** partitura de percusión convencional en SVG
  (cero deps) entre el círculo y las ondas, con edición **bidireccional** y playhead
  sincronizado (ver `NOTACION.md`); ondas reconvertidas en el visual de marca
  **"Florecimiento de Axé"** (señal real + pétalos de evento), fuera el modo paralelo y el
  espectro falso (ver `EVAL-ONDAS.md`).

## ▶️ Próxima iteración: 6 — a elegir con Martín

Candidatas (ver "Pendientes" abajo para el detalle):
- 🤝 **Validación cultural** (arrancar contactos).
- ♿ **Accesibilidad nivel 2**: DOM accesible paralelo + edición por teclado de la partitura
  + pruebas con usuarios reales.
- 🎬 **Export del Florecimiento a video/WebM** (compartible IG + portafolio + alimenta `/reel`).
- 🎼 **Refinar la partitura**: puntillos, silencios consolidados por duración, multi-sistema
  (wrap) para patrones largos.
- 🔧 Infra menor: CI `node-version` 20 → 24; validador de import más estricto.

## Pendientes (evaluar/priorizar)

### 🎼 Vista de notación musical convencional — ✅ HECHO (v2.9.0)
Resuelto con render propio **SVG** (se descartó VexFlow/abcjs por bundle y por el choque
del playhead con su sintetizador). Edición bidireccional + playhead sincronizado. Decisión
y convenciones de grabado en [`NOTACION.md`](./NOTACION.md). **Falta** (refinamiento):
puntillos, silencios consolidados por duración, y *multi-system wrap* para patrones largos
(hoy escalan para caber). Pendiente cultural: validar la notación con la comunidad.

### ♿ Accesibilidad nivel 2 (sobre lo hecho en v2.8.0)
Ya **HECHO** en v2.8.0: navegación por teclado del secuenciador + modo Práctica +
región ARIA-live (ver `ACCESIBILIDAD.md`). Falta el **nivel 2**: DOM accesible paralelo
(un elemento por celda, `role="gridcell"`/`aria-pressed`) para exploración libre con
lector de pantalla; más modos de audio (sonificación de la estructura métrica); y
**pruebas con usuarios reales** de VoiceOver / NVDA. Fuente en `RESEARCH.md`.

### 🤝 Validación cultural
Arrancar los contactos del plan (`VALIDACION-CULTURAL.md`): etnomusicólogo / comunidad,
para validar los toques antes de sumar más presets.

### 🌊 Visualizaciones de onda — función y potencial — ✅ HECHO (v2.9.0)
Evaluación completa en [`EVAL-ONDAS.md`](./EVAL-ONDAS.md). Conclusión: **sí tenían
potencial, pero no como estaban.** Se soltó "Ondas Paralelas" (decoración redundante), se
quitó el "espectro" falso (incoherencia de integridad), y el master se reconvirtió en el
visual de marca **"Florecimiento de Axé"** (radial, señal real + pétalos de evento) + un
modo **Osciloscopio** honesto.

### 🎬 Export del Florecimiento a video/WebM
**Qué:** botón "Exportar video" del florecimiento: `canvas.captureStream(30)` +
`MediaRecorder` → `.webm`. Quemar en el frame el toque, el orixá y el disclaimer cultural.
Pieza compartible (IG) + de portafolio; alimenta el stack `/reel`. **Origen:** EVAL-ONDAS.

### 🔧 Infra menor
- CI: subir `node-version` de 20 → 24 en `deploy.yml` (warning de deprecación en Actions).
- **Validador de import más estricto**: exigir `gridType`/`measures` en los `.ogbon`
  importados, o avisar cuando 48 pasos sean ambiguos (12/8×4 vs 4/4×3). El formato v2 lo
  resuelve para presets guardados por la app; falta blindar el borde de import.
- **`prefers-reduced-motion` en el círculo**: hoy sólo el florecimiento lo respeta; el
  círculo anima siempre.

## Ideas sueltas (sin desarrollar)
- Botón "generá una variación" con ritmos euclidianos (Bjorklund).
- Más toques built-in (avamunha, barravento) una vez validados.
- Compartir un ritmo por link (estado codificado en la URL, sin backend).
