# Accesibilidad por teclado — Ogbón

> Mini-caso de diseño. Documenta **qué** se hizo y, sobre todo, **por qué** — que es
> lo que convierte una feature en una decisión de diseño defendible.

## El problema

El secuenciador de Ogbón es un `<canvas>`: un mapa de bits. Para el mouse y el tacto
es rico, pero para el teclado y para un lector de pantalla es **una caja opaca**: no
recibe foco, no expone su estructura, no se puede operar sin ver ni señalar. Eso deja
afuera a personas con discapacidad visual o motriz — y, de paso, a cualquiera que
prefiera el teclado.

## El patrón de referencia

No inventamos de cero. Nos apoyamos en **"Non-Visual Beats"** (NYU MusEDLab + NYU
Ability Project), que definió un patrón replicable para hacer accesible un
secuenciador radial (el *Groove Pizza*): una **capa de teclado** (Tab / flechas /
teclas numéricas por anillo / barra espaciadora) sumada a **modos de audio** que
permiten "escuchar" el patrón mientras se navega. La investigación previa del proyecto
(ver [`RESEARCH.md`](RESEARCH.md)) lo señaló como "accesibilidad ya resuelta y oro de
portafolio": un problema con solución conocida, que conviene adoptar en vez de improvisar.

## Las decisiones (y su porqué)

El desafío propio fue traducir ese patrón a **nuestra** geometría: un secuenciador
**radial** de 4 anillos concéntricos, no una grilla rectangular.

### 1. Modelo mental: un cursor (anillo, tiempo)

La navegación se piensa como un cursor sobre una matriz de *instrumento × tiempo*, aunque
se dibuje en círculo. Eso da un mapeo de flechas intuitivo:

| Tecla | Acción | Decisión |
|---|---|---|
| **← / →** | tiempo anterior / siguiente | **→ avanza en sentido horario**, igual que la aguja del reloj y que el tiempo musical. Con *wrap-around* (del último tiempo vuelve al primero). |
| **↑ / ↓** | cambiar de anillo | **↑ hacia el anillo externo (Gã)**, ↓ hacia el interno (Lé): coincide con lo que se ve, no con una convención abstracta. |
| **1 – 4** | ir a Gã / Rum / Rumpi / Lé | acceso directo por anillo, como las teclas numéricas de "Non-Visual Beats". |
| **Espacio / Enter** | poner / sacar un golpe | cicla silencio → abierto → cerrado (el Gã, que es una campana, sólo alterna silencio ↔ golpe). |
| **Inicio / Fin** | primer / último tiempo | navegación rápida dentro de la vuelta. |

`Tab` **no** se intercepta: entra y sale del secuenciador con normalidad, respetando el
flujo de foco de la página.

### 2. Foco visible

Al llegar con el teclado, el círculo muestra un **anillo dorado** (`:focus-visible`) y
aparece un **cursor punteado** sobre la celda activa. Sin esto, "estás en el canvas"
sería invisible. El cursor sólo se dibuja con foco, para no ensuciar la vista normal.

### 3. Voz para quien no ve: región ARIA-live

Cada movimiento actualiza una región `aria-live="polite"` que un lector de pantalla lee
en voz alta, p. ej.:

> **"Rum · tiempo 3 de 16 · abierto"**

Es la misma información que el cursor da a la vista, en palabras.

> **Actualización (v2.10).** Esta primera capa usaba `role="application"` sobre el `<canvas>`
> (soporte irregular en lectores de pantalla). Se reemplazó por una **grilla accesible real**
> (`AccessibleGrid`, `role="grid"` con una celda/botón por golpe, *roving tabindex*,
> `aria-label` por celda y `aria-live`). El círculo pasó a `aria-hidden` (sólo visual, con un
> **cursor dorado** que espeja la celda enfocada). La lógica de golpes vive en
> `audio/steps.js` (una sola fuente). Es el "DOM accesible paralelo" que este doc dejaba
> pendiente: ahora se puede explorar **todo** el patrón con los comandos del lector, no sólo
> lo que se anuncia.

### 4. Modo Práctica: escuchar dónde estás

Inspirado en los "modos de audio" del patrón NYU. Con el modo **Práctica** activo (por
defecto), navegar **reproduce el golpe** de la celda donde caés. Así se puede recorrer un
anillo y *oír* el ritmo paso a paso, sin depender de la vista. Es un toggle: quien edita
rápido y no lo quiere, lo apaga.

### 5. Guía métrica: oír la estructura (v2.11)

El modo Práctica dice *qué golpe* hay en una celda, pero no *dónde estás* en el compás. La
**Guía métrica** (toggle aparte, apagado por defecto) sonifica la **estructura métrica** —el
segundo "modo de audio" del patrón NYU— con un **click sintético** corto y jerárquico:

| Posición | Sonido | Cuándo |
|---|---|---|
| **Tiempo fuerte** (primer pulso del compás) | click agudo y fuerte (≈2000 Hz) | al navegar **y** al reproducir |
| **Pulso** | click medio (≈1320 Hz) | al navegar **y** al reproducir |
| **Subdivisión** (entre pulsos) | click tenue (≈880 Hz) | sólo al **navegar** (sería ruido en reproducción) |

Así, recorriendo un anillo con las flechas, se **siente la grilla** (dónde cae el "uno", dónde
los pulsos) sin verla; y al reproducir funciona como **claqueta** con el downbeat acentuado.
El click se enruta **directo al destino de audio** (no pasa por el analizador): es una guía,
no parte de la música, así que **no contamina** la visualización honesta del Axé ni se mezcla
con el compresor. El motor conoce la métrica vía `setMeter(subPorCompás, subPorPulso)`, que
Ogbón sincroniza al cambiar la grilla.

### 6. Coherencia entre modos

Si se toca una celda con el mouse o el dedo, el cursor de teclado **se mueve ahí**. Los
dos modos comparten un mismo cursor, no compiten.

### 7. Menos movimiento si se pide

Se respeta `prefers-reduced-motion`: las animaciones de la interfaz se reducen al mínimo
para quien configuró esa preferencia del sistema.

## Qué queda pendiente (honestidad de alcance)

Lo construido cubre ya el patrón completo; lo que falta es validación humana:

- ✅ **Exploración libre con lector de pantalla** — HECHO (v2.10): grilla accesible
  `role="grid"` con celda por golpe (ver actualización en la sección 3).
- ✅ **Más modos de audio (sonificación de la métrica)** — HECHO (v2.11): la Guía métrica
  (sección 5).
- ⏳ **Pruebas con personas usuarias** de lectores de pantalla (VoiceOver, NVDA) y validación
  del fraseo de los anuncios. Lo implementado sigue el patrón, pero la prueba real es con
  gente — **ya hay un músico ciego contactado** y entusiasmado para esta validación.

## Cómo probarlo

1. Abrir la app y apretar `Tab`: el foco entra en la **grilla accesible** (el cursor dorado
   aparece en el círculo en la celda activa).
2. Mover con flechas, elegir instrumento con 1–4, poner golpes con Espacio/Enter.
3. Para la capa no-visual: activar VoiceOver (`Cmd+F5` en macOS) y navegar — debería
   dictarse cada celda ("Rum, tiempo 3 de 16: abierto").
4. Activar **Guía métrica** (panel ⌨) y volver a navegar: se oye el "uno", los pulsos y las
   subdivisiones. Reproducir con la guía activa = claqueta con downbeat acentuado.

---

*Fuentes: NYU MusEDLab — "Non-Visual Beats" / Accessible Groove Pizza; WAI-ARIA Authoring
Practices. Ver [`RESEARCH.md`](RESEARCH.md) para el detalle del research.*
