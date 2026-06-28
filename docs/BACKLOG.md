# Backlog — Ogbón

Ideas y mejoras pendientes de evaluar/priorizar. No es un compromiso; es el "compost"
de donde salen las próximas iteraciones.

## Estado del proyecto (al 2026-06-28)

- **En vivo:** https://martinlleral.github.io/ogbon/ (PWA instalable)
- **Versión:** v2.11.0 · ver `../CHANGELOG.md` para el mapa de versiones completo
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

- ✅ **Iteración 6 (v2.10.0) — Accesible de verdad:** editor accesible del ritmo
  (`AccessibleGrid`, `role="grid"` navegable por teclado + lector de pantalla, cursor
  dorado en el círculo), círculo `aria-hidden` (sólo visual), `prefers-reduced-motion`,
  lógica unificada en `audio/steps.js`. Infra: CI a Node 24 + actions al día; aviso de
  métrica ambigua al importar.

- ✅ **Iteración 7 (v2.11.0) — Métrica y partitura fina:** **Guía métrica** (claqueta +
  click de posición al navegar: tiempo fuerte / pulso / subdivisión) — el segundo "modo de
  audio" del patrón NYU, cierra la accesibilidad nivel 2. Partitura: **puntillos**,
  **silencios consolidados por duración** y **multi-sistema (wrap)** para patrones largos.
  Exploración documentada de **speech/tap-to-rhythm** (`SPEECH-TO-RHYTHM.md`).

## ▶️ Próxima iteración: 8 — a elegir con Martín

Candidatas (ver "Pendientes" abajo para el detalle):
- 🤝 **Validación cultural** EN CURSO (músico ciego para a11y + sesión grabada con el
  terreiro; guía en `GUIA-SESION-CULTURAL.md`). Al volver: volcar hallazgos y corregir presets.
- 👁 **Pruebas reales de a11y con el músico ciego** (VoiceOver/NVDA): validar la grilla
  accesible + la Guía métrica + el fraseo de los anuncios con una persona usuaria.
- 🥁 **Tap-to-circle** (experimento de bajo esfuerzo recomendado en `SPEECH-TO-RHYTHM.md`):
  tocar el ritmo (espacio/clic/touch) con tempo+métrica elegidos → cae cuantizado en el
  círculo. Entrada de ritmo sin navegar la grilla visual; escalón 1 hacia la voz.
- 🎬 **Export del Florecimiento a video/WebM** (despriorizado por Martín).

## Pendientes (evaluar/priorizar)

### 🎼 Vista de notación musical convencional — ✅ HECHO (v2.9.0 + v2.11.0)
Resuelto con render propio **SVG** (se descartó VexFlow/abcjs por bundle y por el choque
del playhead con su sintetizador). Edición bidireccional + playhead sincronizado. Decisión
y convenciones de grabado en [`NOTACION.md`](./NOTACION.md). **Refinamientos HECHOS (v2.11.0):**
**puntillos**, **silencios consolidados por duración** y **multi-sistema (wrap)** para
patrones largos. **Falta** (cultural): validar la notación con la comunidad. Posibles
futuros menores: cabezas huecas para duraciones largas, ligaduras (hoy se aproxima al valor
estándar más cercano — decisión consciente para no agregar ruido).

### ♿ Accesibilidad
- v2.8.0: navegación por teclado + modo Práctica + ARIA-live (ver `ACCESIBILIDAD.md`).
- **v2.10.0 (nivel 2): HECHO** el DOM accesible paralelo (`AccessibleGrid`, `role="grid"`
  con celda por golpe, roving tabindex, edición por teclado/lector de pantalla, cursor en
  el círculo) + `prefers-reduced-motion`.
- **v2.11.0: HECHO** el segundo modo de audio — **Guía métrica** (sonifica tiempo fuerte /
  pulso / subdivisión al navegar; claqueta con downbeat acentuado al reproducir).
- **Falta (lo más importante):** **pruebas con el músico ciego** (ya contactado y
  entusiasmado) — VoiceOver/NVDA reales, validar fraseo de anuncios y la Guía métrica.

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

### 🔧 Infra menor — ✅ HECHO (v2.10.0)
- CI a **Node 24** + actions a sus últimas majors (silencia la deprecación de Node 20).
- Import: **aviso** de métrica ambigua (48/96 pasos sin `gridType`). (Pendiente opcional:
  exigir `gridType`/`measures`, pero rechazaría imports viejos legítimos.)
- `prefers-reduced-motion` en el círculo (suprime haces/glow/neón decorativos).

### 🥁 Entrada de ritmo por voz/tap ("decí/tocá el toque y lo escribo")
Exploración técnico-cultural completa en [`SPEECH-TO-RHYTHM.md`](./SPEECH-TO-RHYTHM.md).
Conclusión: lo viable y honesto hoy es **tap-to-circle** (tocás el ritmo con tempo+métrica
dados → snap a la grilla), que además es **puerta de accesibilidad** (crear un ritmo sin
navegar el canvas, precedente QWERTYBeats/NYU) y **escalón 1** hacia la voz (mismo pipeline,
cambia la fuente del onset). La transcripción de beatbox y el "cantá el toque con sílabas"
quedan a futuro y **requieren validación cultural** (el sistema silábico del Candomblé no
está documentado como formal).

## Ideas sueltas (sin desarrollar)
- Botón "generá una variación" con ritmos euclidianos (Bjorklund).
- Más toques built-in (avamunha, barravento) una vez validados.
- Compartir un ritmo por link (estado codificado en la URL, sin backend).
