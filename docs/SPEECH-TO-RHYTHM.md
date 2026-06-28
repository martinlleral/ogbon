# "Decí / tocá el toque y lo escribo" — exploración de entrada por voz/tap

> Mapa de posibilidades para **futuras versiones** de Ogbón, no un plan de implementación.
> Pregunta: ¿hay forma *sencilla* de que alguien **diga, cante, beatboxee o toque** un ritmo
> y caiga como golpes editables sobre los círculos? Destila una investigación con fuentes.
>
> **✅ Actualización (v2.12.0):** la **opción A — "Tap-to-circle"** (la recomendación de abajo)
> ya está implementada como el **"Modo Toque"**. El resto del documento queda como mapa de los
> siguientes escalones (onset de voz/beatbox, mapeo a atabaques, sílabas), que siguen a futuro.

## Resumen ejecutivo

- **Sí hay algo viable y simple hoy — pero no es "decir el ritmo y que salga perfecto".** Lo
  maduro y 100% offline en el navegador es la cadena **detección de ataques (onsets) →
  cuantización a la grilla**, *siempre que el usuario fije el tempo y la métrica* (12/8 vs
  4/4). Adivinar tempo + métrica desde voz libre es justo la parte poco confiable.
- **Lo más prometedor para Ogbón no es la IA: es el patrón de interacción.** El precedente
  directo es **QWERTYBeats** (NYU MusEDLab): grabás tu sonido y se reproduce *cuantizado*. El
  mismo laboratorio que hizo el secuenciador circular (*Groove Pizza*, primo de Ogbón) dice
  que ese círculo es **"totalmente inadecuado para personas ciegas o con baja visión"** — y
  construyó la entrada por voz/tap como **respuesta de accesibilidad**. Esa dupla es la tesis.
- **La transcripción de beatbox a batería** tiene ~20 años de investigación y una receta
  estable (onset → features → clasificador **adaptado al usuario**). Con sonidos limpios y
  *calibración por persona* llega a F1 de onset ~0,94 y clasificación ~85–95%. Sin
  entrenamiento, o con sonidos rápidos/polifónicos, cae fuerte. Los productos reales (Dubler
  2, SoundID VoiceAI) son apps nativas/plugins, **no web offline**. "MIDI editable + sin
  entrenamiento + en navegador + offline" **no existe maduro todavía** (mediados 2026).
- **El gancho cultural pide honestidad.** Konnakol (India del Sur) y los *bols* de tabla
  (Norte) son precedentes de hierro donde *cada sílaba = un golpe*. **Pero NO hay evidencia de
  que el Candomblé tenga un sistema formalizado de sílabas para los toques.** Lo documentado
  es transmisión **oral e imitativa** (gã → lé → rumpi → rum, guiada por el alabê) y
  onomatopeya *informal* ("TUM TÁ" grave/agudo). Decir que "el Candomblé canta sus toques con
  sílabas" sería **sobreafirmar la evidencia**.

## Lo SEGURO/estándar vs lo OPINABLE / a validar

**Seguro (se puede afirmar):**
- El secuenciador radial es buen patrón para ritmo cíclico (Groove Pizza; Benadon, *MTO*).
- Onset detection + snap a grilla con tempo/métrica *dados* es matemática estándar y corre
  offline en el navegador (aubiojs, Meyda).
- "Capturá suelto, cuantizá después" es canon de drum machines (TR-808, Maschine).
- Las grillas visuales son inaccesibles para usuarios ciegos; el `<canvas>` **no** es
  accesible (MDN); una entrada por voz/tap **esquiva eso del lado del input**. QWERTYBeats es
  el precedente directo.

**Opinable / requiere validación con la comunidad:**
- **Que el Candomblé tenga un sistema silábico de toques: NO documentado.** Afirmarlo sería
  inventar tradición. Lo real es oralidad + imitación + onomatopeya informal.
- **Qué sonido vocal mapea a qué atabaque** (Rum/Rumpi/Lé/gã) es decisión *cultural*, no
  técnica: co-diseñar con alabês/ogãs.
- El puente yoruba **"Gun Dun Go Do Pa Ta"** (djembe) es defendible (Candomblé Ketu es de
  raíz yoruba) pero su origen está en pedagogía de tambor, no en etnomusicología revisada.
- Auto-detección de tempo y de 12/8-vs-4/4 desde voz libre: poco confiable. No prometer en UI.

## Opciones priorizadas para Ogbón (impacto/esfuerzo)

| # | Opción | Esfuerzo | Qué daría | Riesgo / validación |
|---|---|---|---|---|
| **A** | **Tap-to-circle**: tocar el ritmo (espacio/clic/touch), tempo+métrica elegidos por el usuario, snap a la porción más cercana | **BAJO** | Entrada sin navegar la grilla visual; base de accesibilidad. *Sin ML ni red.* | Bajo. Acotar a 1–2 compases por la deriva. No necesita validación cultural |
| **B** | **A + tap-tempo**: tocás 4 pulsos para *fijar* el tempo antes de grabar | **BAJO-MEDIO** | Lo de A + tempo "sentido" sin tipear BPM | Errores de octava si el tap es irregular → mostrar el BPM detectado |
| **C** | **Onset detection de voz/beatbox** con tempo+métrica manuales | **MEDIO** | "Beatboxeá el toque y lo escribo" en una sola pista | Onsets vocales blandos → falsos/dobles. Ojo licencia: Essentia.js es AGPL |
| **D** | **Mapear a los 4 atabaques** por registro (grave→Rum, agudo→Lé, brillo→gã) | **MEDIO-ALTO** | Acercarse a "decí el toque y se reparte en los anillos" | Clasificar sin calibrar por usuario es frágil. **Mapeo = decisión cultural** |
| **E** | **"Cantá el toque con sílabas"** (vocables tipo "TUM TÁ" / yoruba) | **ALTO** | Puente cultural + accesibilidad | **Sistema silábico del Candomblé no documentado** → riesgo de inventar tradición. Co-diseño obligatorio |
| **F** | **Transcripción ML completa** (modelo entrenado → MIDI) | **ALTO** | Beatbox suelto → patrón completo | No existe maduro offline-web; pesa; precisión cae fuera de laboratorio |

## Recomendación: un experimento de bajo esfuerzo

**Construir "Tap-to-circle" (opción A, con tap-tempo de B).** El usuario fija tempo y métrica,
toca el ritmo con la barra espaciadora / clic / touch, y cada golpe cae cuantizado en la
porción más cercana del anillo activo. Por qué ésta:

1. **Esfuerzo real bajo, sin riesgo técnico**: `performance.now()` + `round(t / duraciónCelda)`.
   Encaja en React + Web Audio + Canvas, 100% offline. Los onsets de un *tap* son nítidos
   (a diferencia de los vocales, blandos) → la cuantización funciona de verdad.
2. **Es la puerta de accesibilidad con el precedente más fuerte** (replica lo que hizo
   QWERTYBeats ante un secuenciador radial "inadecuado para usuarios ciegos"). Crear un ritmo
   *sin navegar el canvas* es la jugada — y queda redonda para el portafolio UX.
3. **Es el escalón 1 honesto hacia la voz**: el pipeline tap → onset → snap → círculo es *el
   mismo* que después usaría el beatbox (opción C); sólo cambia la fuente del onset.
4. **No requiere validación cultural para arrancar** (un tap es input genérico), así que se
   puede enviar ya, y *después* abrir la conversación con el terreiro para lo que sí la
   necesita (mapeo a atabaques, vocabulario silábico).

**Frase honesta para la UI/portafolio:** *"Decir el ritmo y que salga perfecto" todavía no es
realista en un navegador offline sin entrenar el sistema con tu voz. Pero "tocá el ritmo y cae
en su lugar" sí lo es — y abre Ogbón a quien no puede (o no quiere) navegar la grilla con la
vista.*

## Fuentes principales

- **QWERTYBeats / Non-Visual Beats** (NYU MusEDLab + Ability Project): wp.nyu.edu/musedlab/2016/10/07/design-for-real-life-qwertybeats-research/
- **Groove Pizza** (secuenciador radial accesible, precedente directo): apps.musedlab.org/groovepizza/
- **Dataset AVP** (percusión vocal; DSP clásico ~0,94 F1 > deep learning en pocos datos): ar5iv.labs.arxiv.org/html/2009.11737
- **Stowell & Plumbley** (decisión retrasada onset, trade-off latencia/precisión): qmro.qmul.ac.uk
- **Vochlea Dubler 2** (voz→MIDI con entrenamiento por sonido): vochlea.com/products/dubler2
- **web-audio-beat-detector / music-tempo (BeatRoot)**: github.com/chrisguttandin/web-audio-beat-detector · github.com/killercrush/music-tempo
- **Meyda.js (MIT) / Essentia.js (AGPL) / aubiojs (MIT)**: meyda.js.org · essentia.upf.edu · github.com/qiuxiang/aubiojs
- **Konnakol / bols de tabla** (sílaba = golpe): en.wikipedia.org/wiki/Konnakol · en.wikipedia.org/wiki/Bol_(music)
- **Candemil 2020** (enseñanza oral del candomblé, *El Oído Pensante* 8(1)): redalyc.org/journal/5529/552963071019/html/
- **Candemil 2021** (tablatura TUBS para atabaques — creada *porque* la tradición es oral, *Revista da ABEM*): revistaabem.abem.mus.br/revistaabem/article/view/910
- **MDN — `<canvas>` no es accesible**: developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas
- **Revisión a11y instrumentos no-visuales (arXiv 2508.00929, 2025)**: arxiv.org/pdf/2508.00929

*Investigación: pase multi-fuente verificado, 28/6/2026. Lo cultural debe validarse con la
comunidad antes de afirmarse en la UI o el portafolio.*
