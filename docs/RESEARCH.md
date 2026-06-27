# Informe de investigación — Ogbón (2026-06)

> Research multiagente con verificación adversarial. **103 agentes**, 5 ángulos,
> 21 fuentes fetcheadas, 100 claims extraídos → 25 verificados por votación de 3
> (se necesita 2/3 para refutar) → **21 confirmados, 4 refutados**.

Objetivo: identificar mejoras accionables para Ogbón como (a) herramienta real y
(b) pieza de portafolio UX/Producto, en 5 dimensiones (UX de secuenciadores,
autenticidad cultural, Web Audio, PWA/móvil, narrativa de portafolio).

---

## Hallazgos confirmados (alta confianza)

### Diseño / UX
- **El layout radial es una decisión funcionalmente correcta, no decorativa.** En un
  círculo, los golpes métricamente relacionados quedan enfrentados y las simetrías
  rotacionales revelan la estructura métrica que una grilla rectangular oculta — ideal
  para ritmos ternarios 12/8. *(NYU MusEDLab — Groove Pizza; Toussaint, "The Geometry of
  Musical Rhythm").*
- **Limitar la cantidad de instrumentos baja la barrera de entrada.** Groove Pizza
  evolucionó de 6→5→3 anillos para reducir la "parálisis de opciones". Los 4 instrumentos
  fijos de Ogbón están doblemente justificados (UX pedagógica + autenticidad del ensamble).
- **La accesibilidad de un secuenciador radial ya está resuelta y es oro de portafolio.**
  El proyecto "Non-Visual Beats" (NYU + Ability Project) define un patrón replicable:
  capa de teclado (TAB / flechas / teclas 1-4 por anillo / SPACE) + 3 modos de audio
  (Práctica con lector de pantalla, Sonificación, Performance). *(NYU Scholars; repo
  `NYUMusEdLab/Accessible-Groove-Pizza`).*

### Autenticidad cultural
- **El modelo de 4 instrumentos está validado etnomusicológicamente.** Rum (grave) =
  líder que improvisa/conduce; Rumpi (medio) y Lé (agudo) = patrones de sostén fijos;
  Gã/agogô = clave/timeline. La improvisación del Rum es **diálogo litúrgico estructurado**,
  no azar libre. *(Megna 2021, GMU; monografía Fulcrum/U. Michigan).*
- **Ijexá es el preset bandera óptimo.** Es el toque de Candomblé más conocido fuera de
  los terreiros, influyó en la MPB (Gilberto Gil, Caetano, afoxés como Filhos de Gandhi)
  → reconocible y de menor sensibilidad para mostrar público. Cinco toques Ketu
  documentados: hamunha, lagunló, agueré, daró, ijexá. *(GMU; Wikipedia; Revista USP).*
- **El encuadre ético es obligatorio.** El tambor afrobrasileño es blanco de racismo
  religioso activo en Brasil (1.478 denuncias en 2023, +80%; terreiros incendiados).
  Ver [`VALIDACION-CULTURAL.md`](VALIDACION-CULTURAL.md). *(Boaz & Vaughan, "Silencing the
  Drum", U. Michigan; US State Dept IRF Report 2023; MDPI Religions 2024).*

### Web Audio
- **El scheduler de Ogbón ya usa el estándar de oro** (look-ahead de Chris Wilson contra
  `AudioContext.currentTime`). El reloj JS (`Date.now`/`setTimeout`) es ~44× demasiado
  grueso y se desvía por layout/GC. *(web.dev "A Tale of Two Clocks"; MDN; W3C).*
- **La síntesis de membrana se vuelve realista con pitch sweep descendente sutil**
  (Ogbón ya lo hace) **+ modulación LFO leve** para variación entre golpes — preferir
  LFOs no sincronizados para evitar repetición. *(Nord Modular Book, McGill; Sound on
  Sound).* ⚠️ Pendiente de decisión: choca parcialmente con la preferencia de "pulso
  perfecto sin humanize".
- **AudioWorklet es un upgrade opcional**, no requerido: Ogbón ya sintetiza con nodos
  nativos sample-accurate. Presupuesto duro ~3ms/quantum si se migra. *(Mozilla Hacks;
  Chrome for Devs).*

### PWA / móvil
- **Screen Wake Lock API** mantiene la pantalla encendida mientras suena. Baseline en
  todos los navegadores desde mayo-2024, funciona sobre HTTPS en foreground (el caso de
  Ogbón). *(Chrome for Devs; MDN; web.dev).*
- **Canvas borroso en alta densidad** se corrige con `devicePixelRatio` (ya aplicado en
  v2.5). *(web.dev "canvas-hidipi").*

---

## Refutado (qué NO hacer)
- ❌ La grilla rectangular de 16 pasos **no** es superior a la radial (voto 1-2). La
  elección radial de Ogbón está bien.
- ❌ "Compartir vía links de proyectos en la nube" **no** está validado como estándar
  (1-2). El modelo de compartir/exportar queda como pregunta abierta.
- ❌ El mapeo específico toque→nación (Cabula/Barravento/Congo=Angola, etc.) fue
  **refutado** (1-2). No agrupar presets por nación sin validación adicional.
- ❌ La campana **no** requiere síntesis aditiva con muchos osciladores inarmónicos
  (0-3). La FM inarmónica actual de Ogbón está bien — no tocar.

## Preguntas abiertas
- **Portafolio UX (dimensión 5):** quedó sin claims verificados; requiere research dedicado.
- **Modelo de compartir/exportar ritmos:** sin respaldo; decidir (archivo, URL-estado, etc.).
- **Agrupar/etiquetar presets por nación:** necesita validación etnomusicológica + comunitaria.
- **Validación comunitaria concreta:** lo más opinable; ver `VALIDACION-CULTURAL.md`.

## Fuentes primarias
- NYU MusEDLab — Evolution of the Groove Pizza · Non-Visual Beats
- web.dev — A Tale of Two Clocks (Chris Wilson) · canvas-hidipi
- MDN — Web Audio Advanced Techniques · Screen Wake Lock API
- Megna 2021 (George Mason University) — Atabaques Rum-Drum Solos in Candomblé Ketu
- Boaz & Vaughan — "Silencing the Drum" (U. Michigan Press)
- Nord Modular Book (McGill CIM) — percussion synthesis

*Informe crudo (JSON con votos y evidencia por claim) archivado fuera del repo.*
