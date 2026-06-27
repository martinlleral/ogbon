# Backlog — Ogbón

Ideas y mejoras pendientes de evaluar/priorizar. No es un compromiso; es el "compost"
de donde salen las próximas iteraciones.

## Estado del proyecto (al 2026-06-27)

- **En vivo:** https://martinlleral.github.io/ogbon/ (PWA instalable)
- **Versión:** v2.6.0 · ver `../CHANGELOG.md` para el mapa de versiones completo
- ✅ **Iteración 1 (v2.5.0) — Cimientos:** fix Haces + fidelidad de presets, nitidez
  retina, sin Supabase (offline), 3 toques con fuentes, ijexá al abrir.
- ✅ **Iteración 2 (v2.6.0) — Móvil:** PWA instalable + offline, Screen Wake Lock,
  rediseño con transporte fijo abajo + círculo protagonista.

## ▶️ Próxima iteración: 3 — "Comodidad"

Objetivo: pulir la experiencia de uso (estética limpia + primer uso claro).

1. **Reemplazar los diálogos nativos feos** (`prompt`/`confirm`/`alert`) por componentes
   propios en la estética dorada-oscura:
   - Modal de input para "Guardar" (nombre del ritmo).
   - Modal de confirmación para "Eliminar".
   - Toast/aviso no-bloqueante para "builtin no se borra" e "import inválido".
   - Implementación sugerida: un `<Modal>` reutilizable (o `<dialog>` estilizado) +
     un `<Toast>`. Sin librerías nuevas.
2. **Micro-onboarding**: hint "tocá un círculo para crear tu ritmo" la primera vez
   (flag en localStorage para no repetir).
3. **Feedback visual** al guardar/cargar un preset (un toast de confirmación).

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
