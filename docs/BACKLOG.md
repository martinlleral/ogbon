# Backlog — Ogbón

Ideas y mejoras pendientes de evaluar/priorizar. No es un compromiso; es el "compost"
de donde salen las próximas iteraciones.

## Estado del proyecto (al 2026-06-27)

- **En vivo:** https://martinlleral.github.io/ogbon/ (PWA instalable)
- **Versión:** v2.7.0 · ver `../CHANGELOG.md` para el mapa de versiones completo
- ✅ **Iteración 1 (v2.5.0) — Cimientos:** fix Haces + fidelidad de presets, nitidez
  retina, sin Supabase (offline), 3 toques con fuentes, ijexá al abrir.
- ✅ **Iteración 2 (v2.6.0) — Móvil:** PWA instalable + offline, Screen Wake Lock,
  rediseño con transporte fijo abajo + círculo protagonista.
- ✅ **Iteración 3 (v2.7.0) — Comodidad:** diálogos propios (modal input/confirm +
  toasts) en vez de prompt/confirm/alert; hint de primer uso (localStorage);
  accesibilidad en modales (teclado + prefers-reduced-motion); emoji 🥁→🪘; fix
  import .ogbon corrupto.

## ▶️ Próxima iteración: 4 — a elegir con Martín

Candidatas (ver "Pendientes" abajo para el detalle):
- 🎼 **Notación musical convencional** entre el círculo y las ondas (spike primero).
- ♿ **Accesibilidad por teclado completa** en el secuenciador (patrón NYU). Ojo: en
  v2.7.0 ya se cubrió el teclado en los *modales*, falta el secuenciador en sí.
- 🤝 **Validación cultural** (arrancar contactos).
- 🔧 Infra menor: CI `node-version` 20 → 24.

## Pendientes (evaluar/priorizar)

### 🎼 Vista de notación musical convencional
**Qué:** representar el ritmo en **notación musical convencional** (partitura de
percusión), **entre el círculo y las ondas**. Tres lecturas del mismo ritmo.
**A evaluar:** notación de percusión 4 voces (cabezas open/closed), 12/8 y 4/4,
sincronizar playhead, **VexFlow** vs **abcjs** vs render propio SVG. Empezar por un spike.
**Dependencia cultural:** validar la notación con la comunidad (ver `VALIDACION-CULTURAL.md`).
**Origen:** pedido de Martín, 2026-06-27.

### ♿ Accesibilidad por teclado (patrón NYU "Non-Visual Beats")
Navegación por teclado (TAB/flechas/1-4/SPACE) + modos de audio (Práctica/Sonificación/
Performance). Inclusivo **y** oro de portafolio UX. Fuente en `RESEARCH.md`.

### 🤝 Validación cultural
Arrancar los contactos del plan (`VALIDACION-CULTURAL.md`): etnomusicólogo / comunidad,
para validar los toques antes de sumar más presets.

### 🔧 Infra menor
- CI: subir `node-version` de 20 → 24 en `deploy.yml` (warning de deprecación en Actions).

## Ideas sueltas (sin desarrollar)
- Botón "generá una variación" con ritmos euclidianos (Bjorklund).
- Más toques built-in (avamunha, barravento) una vez validados.
- Compartir un ritmo por link (estado codificado en la URL, sin backend).
