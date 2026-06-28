# Evaluación de las visualizaciones de onda — función, potencial y decisión

> Pedido (Martín, 28/6/2026): *evaluar qué función tienen las ondas (paralelas vs
> transcendental) y si tienen potencial — estético-artístico incluso — o no.*
> Resultado: **sí tienen potencial, pero no como estaban.** Se rehízo el visual.
> Componente: [`src/components/WaveCanvas.jsx`](../src/components/WaveCanvas.jsx).

## Qué había (y qué función cumplía de verdad)

Separando tres funciones posibles — **decorativa**, **pedagógica** (enseña ritmo) y
**feedback** (te ayuda a oír/ver lo que tocás):

**"Ondas Paralelas"** — 4 líneas horizontales, una por instrumento, cada una ondulando
según una **envolvente scripteada** (valores fijos 0.8/1.0/0.6 con decay), no la señal
real. El punto de actividad sí era real, pero **redundante** con el círculo (que ya pulsa
el anillo y muestra el playhead). Veredicto: **~80% decoración**, sin función que el
círculo no cubriera ya. Además, su lenguaje (pistas apiladas) **contradice** la metáfora
radial de Ogbón.

**"Onda Transcendental"** (master) — un osciloscopio real del bus maestro
(`getByteTimeDomainData`): **la única señal honesta y no redundante** de todo el panel
(muestra la *textura sonora agregada*). PERO debajo tenía unas **"barras de espectro" que
NO eran un espectro**: reusaban datos *time-domain*, no una FFT. Parecían un analizador de
frecuencias y no lo eran.

## El problema de integridad (lo que más importa para el portafolio)

Ogbón tiene una **doctrina explícita de honestidad**: los presets se etiquetan
"aproximación didáctica, pendiente de validación comunitaria", con fuente y nivel de
confianza ([VALIDACION-CULTURAL.md](./VALIDACION-CULTURAL.md)). Que el mismo producto, tan
escrupuloso con la verdad etnomusicológica, mostrara un **"espectro" que no es un espectro**
y **"ondas de instrumento" inventadas con `sin()`**, era una **incoherencia de integridad**.
La distinción es técnica pero verificable (un espectro real sale de `getByteFrequencyData`;
reusar `getByteTimeDomainData` y llamarlo "spectrum" es exactamente lo que un revisor con
oído detecta). Marco: **integridad gráfica de Tufte** — un gráfico no debe tergiversar el
dato que representa.

## Decisión

**No mantener ambos. Soltar "Ondas Paralelas", quitar el espectro falso, y reconvertir el
master en un visual de marca radial y honesto.** El panel ahora ofrece dos modos, los dos
apoyados **sólo en datos reales**:

### 🌀 Florecimiento de Axé (`bloom`, por defecto) — el visual de marca

- La **forma de onda real del master** (`getByteTimeDomainData`) se mapea a **radio**: una
  corona dorada que late con la señal. En silencio es un círculo calmo; al sonar, ondula.
- Cada golpe emite un **pétalo** que se expande y se desvanece desde el centro, coloreado
  por instrumento — alimentado por **`activeNotes`** (la *misma data de evento* que dispara
  el audio). Principio McLaren / ANIMUSIC: **la imagen nace del sonido, no de un `sin()`
  inventado.** Cero deshonestidad.
- Es **radial**: rima con el círculo secuenciador (mismo centro, mismos colores) en vez de
  pelear con la metáfora. *Axé* = energía/fuerza vital; el florecimiento dorado la evoca
  **sin** apropiarse de iconografía litúrgica (se enmarca como "energía", no como símbolo
  sagrado — coherente con la doctrina de respeto).

### Osciloscopio (`scope`) — lectura analítica honesta

La forma de onda real del master, ventaneada y con brillo, + indicadores de actividad por
instrumento que **leen el paso real**. La textura sonora agregada, sin adornos falsos.
Útil para sentir cómo se solapan los golpes y afinar el mixer.

## Costo / impacto

| Acción | Impacto | Esfuerzo |
|---|---|---|
| Eliminar "Ondas Paralelas" | Alto (menos ruido, menos código, coherencia) | Bajo |
| Quitar el "espectro" falso | Alto (cierra la incoherencia de integridad) | Bajo |
| Florecimiento de Axé radial | Alto (visual de marca + diferenciación) | Medio |

Bundle: **+0 dependencias** (reusa el `AnalyserNode` y `activeNotes` que el engine ya
exponía). El visual quedó en el panel colapsable "🌀 Axé" para no sumar ruido; queda como
decisión de producto si **destacarlo** más (siempre visible / fondo opt-in).

## Pendiente / futuro (anotado en el backlog)

- **Export a video/WebM** del florecimiento (`canvas.captureStream` + `MediaRecorder`):
  pieza compartible (IG) y de portafolio; alimentaría el stack `/reel`. Quemar en el frame
  el toque, el orixá y el disclaimer cultural.
- `prefers-reduced-motion`: ofrecer una versión más quieta del florecimiento.
- Evaluar si el florecimiento merece más protagonismo que un panel colapsado.

## Ángulo de portafolio

La mejor historia de criterio del proyecto: **auditamos una feature por valor genuino vs.
decoración y matamos la mitad.** Saber **quitar** señala más madurez de producto que saber
agregar. Y muestra **pensamiento sistémico**: la coherencia entre la ética de *datos*
(visualización honesta) y la de *cultura* (presets con su nivel de confianza) es la misma.
El visual nuevo, además, unifica el **lenguaje de diseño** (todo radial) y nace de la data
real — diseño con *rationale*, no decoración.
