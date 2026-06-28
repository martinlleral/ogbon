# Notación musical convencional — decisiones de diseño e ingeniería

> Vista de **partitura** de Ogbón: la tercera lectura del mismo ritmo, junto al círculo
> radial y a la visualización de Axé. Sincronizada **bidireccionalmente** con el círculo.
> Componente: [`src/components/NotationCanvas.jsx`](../src/components/NotationCanvas.jsx).

Este documento sirve doble propósito: registro técnico **y** material de caso de estudio
(transición a UX Research / Service Design / Product). Cuenta el *porqué* de cada decisión.

## El problema

Ogbón ya tenía dos representaciones del ritmo: el **círculo radial** (secuenciador) y las
**ondas**. Faltaba la lectura que un músico formado espera: **notación de percusión
convencional**. El pedido (Martín, 28/6/2026) sumó una exigencia clave: que la partitura
**se sincronice bidireccionalmente** con el círculo — editar en una actualiza la otra.

## Decisión 1 — Renderizar a mano con SVG (cero dependencias)

Se evaluaron tres caminos (investigación documentada): **VexFlow** (~450–800 KiB),
**abcjs** (~300 KiB+), y **SVG a mano** (0 KB nuevos). Ganó SVG a mano. Razones:

| Criterio | SVG a mano | VexFlow / abcjs |
|---|---|---|
| Bundle (PWA offline) | **0 KB** | +3–4× el bundle actual (214 KB) |
| Edición click-a-celda bidireccional | **trivial** (cada celda es un `<rect>` que llama al mismo `onStepToggle` que el círculo) | indirecto: mapear pixel→nota y reconstruir |
| Playhead sincronizado a Web Audio | **perfecto** (RAF lee `engine.getPlaybackPos()`, igual que el círculo) | abcjs ata el cursor a *su propio* sintetizador → choca con nuestro reloj |
| Percusión 4 voces, cabezas open/closed | control total | el staff de 1 línea por instrumento no es de primera clase en VexFlow |
| Estética dark-gold | nativa (`fill`/`stroke`) | pensadas para partitura negra sobre blanco |

**Por qué SVG y no Canvas** (a diferencia del círculo, que es Canvas): la partitura es
**casi estática** (sólo cambia al editar). SVG da hit-testing por elemento, glifos nítidos
sin manejar `devicePixelRatio`, y estilo por CSS. Lo único que se mueve cada frame —el
playhead— se anima aparte, sin re-render de React.

**La sincronización bidireccional sale **gratis** por arquitectura**: `steps` vive en
`Ogbon.jsx`; el círculo y la partitura reciben el mismo `steps` y el mismo `onStepToggle`.
Un único *source of truth*, dos vistas. (Es el patrón de Groove Pizza, NYU MusEDLab.)

## Decisión 2 — Convenciones de grabado (para que no parezca amateur)

- **Cuatro pentagramas de UNA línea** (Gã / Rum / Rumpi / Lé, de arriba hacia abajo, en
  sus colores), no un pentagrama de 5 líneas con 4 voces apiladas. Más legible y
  **clickeable**, y mapea 1:1 con los 4 anillos del círculo. Convención válida para
  percusión no afinada (Wikipedia *Percussion notation*; LilyPond `drums-style`).
- **Clave neutral de percusión** (dos barras verticales) — el estándar moderno para
  instrumentos no afinados.
- **Cabezas de nota**:
  - **Gã** (idiófono): **×** (cruz), el glifo estándar para campanas/címbalos. El círculo
    también dibuja el Gã como ×.
  - **Atabaques**: cabeza **ovalada rellena siempre** (la duración la dan la plica y las
    barras). La **articulación** se marca aparte, como en bronces/hi-hat: **○ = abierto**,
    **+ = cerrado/apagado**, debajo de la cabeza. *Por qué no hueco=abierto:* una cabeza
    hueca significa blanca/redonda (≥2 tiempos); una cabeza hueca **con bandera** se
    contradice con esa regla — un lector formado la lee mal. Las marcas ○/+ mantienen la
    semántica de duración limpia. La **coherencia con el círculo** se sostiene por el
    **color** de cada instrumento (no hace falta el mismo glifo), y el ○ rima con el anillo
    hueco del círculo.
  - **Leyenda** siempre visible (`× Gã · ○ abierto · + cerrado`): la notación de tambor de
    mano no tiene un estándar único, así que la leyenda es obligatoria.
- **Duración = intervalo hasta el próximo ataque** (acotado al compás). Esto es lo que
  hace que se lea bien: un golpe cada 2 semicorcheas se nota como **corchea**, no como
  semicorchea suelta. Sin esto, un patrón de corcheas se dibujaba (mal) como semicorcheas
  con doble bandera.
- **Barras (beams) por pulso**: grupos de **3 corcheas** en 12/8 y de **4 semicorcheas**
  en 4/4 (con **barra secundaria** y *stub* para una semicorchea suelta). Nunca se barra
  cruzando el pulso ni la barra de compás. Plicas **largas** hacia arriba (las plicas
  cortas son el delator #1 del software malo).
- **Silencios**: uno por **pulso vacío** o por silencio inicial del compás (no uno por
  cada celda muda — saturaría). Una **grilla de pulso tenue** marca las posiciones.
- **Cifra de compás** (12/8 ó 4/4) apilada y centrada; **barras de compás** entre compases;
  **barra final** gruesa.
- **Glifos como paths SVG**, no fuentes musicales (su soporte en móvil es irregular).

## Decisión 3 — Playhead sin re-render

El playhead (línea dorada) y el resaltado de la **columna activa** se animan en un loop de
`requestAnimationFrame` que lee el engine por `ref` y escribe atributos del DOM
directamente — **fuera del ciclo de render de React**. La partitura (cabezas, barras) sólo
se re-renderiza al **editar**. Es el mismo patrón del needle del círculo. Meter el playhead
en estado de React serían 60 re-renders/segundo: el error a evitar.

## Simplificaciones conscientes (v1) y trabajo futuro

Honestidad sobre lo que **no** es perfecto todavía (y por qué está bien para un v1):

- **Sin puntillos**: una duración de 3 pasos (corchea con puntillo) se aproxima como
  corchea. Se apoya en la grilla para desambiguar.
- **Glifo de silencio** estilizado (no escala por duración): señala "silencio acá".
- **Patrones largos** (varios compases) **escalan para caber** en vez de envolverse en
  varios sistemas (*multi-system wrapping*): refinamiento futuro.
- **Accesibilidad**: la partitura es una superficie **visual y de puntero** (`aria-hidden`);
  el **círculo** sigue siendo la superficie accesible por teclado y lector de pantalla
  (navegación completa + región ARIA-live). La edición por teclado de la partitura es
  trabajo de *accesibilidad nivel 2* (ya en el backlog).

## Ángulo de portafolio

La historia no es "dibujé una partitura": es **una decisión de producto bajo restricciones
reales**. (1) Elegí *no* sumar una librería de 600 KB para no romper la PWA liviana que los
usuarios reales (músicos, comunidad, teléfonos modestos) necesitan — y conseguí edición
bidireccional y playhead sincronizado *gracias a* construirlo a mano sobre el estado que ya
existía. (2) Respeté las convenciones de grabado de percusión (con fuentes) para que la
pieza señale rigor, y **documenté las simplificaciones** en vez de esconderlas. Saber qué
*no* hacer (todavía) es tan parte del criterio como saber qué hacer.
