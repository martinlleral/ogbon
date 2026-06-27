# Plan de validación cultural — Ogbón

> Ogbón representa **percusión sagrada de Candomblé**, una tradición religiosa de matriz
> africana **viva**. Este documento define cómo encuadrar, acreditar y validar ese
> contenido con responsabilidad antes de publicarlo como presets "auténticos".

## Por qué esto no es opcional

La investigación previa (informe en [`docs/RESEARCH.md`](RESEARCH.md), claim verificado 3-0)
estableció que el tambor afrobrasileño es blanco de **racismo religioso activo y violento
en Brasil**: 1.478 denuncias de intolerancia religiosa al Dial 100 en 2023 (+80% interanual),
terreiros incendiados, sobre-policiamiento. Hay una monografía peer-reviewed de la
Universidad de Michigan titulada literalmente *"Silenciando el tambor"* (Boaz & Vaughan).

Conclusión: **no se puede publicar esto como una "drum machine exótica"**. El encuadre
respetuoso y contextualizado es parte del producto, no un agregado.

## Estado actual de los presets (honestidad)

Los toques que vienen incluidos (`src/audio/presets.js`) son **aproximaciones didácticas**
derivadas de fuentes etnomusicológicas secundarias (disertaciones, transcripciones
académicas), **no transcripciones litúrgicas validadas por practicantes**. Cada preset
declara su nivel de confianza y su fuente. Hasta que se complete la validación de abajo,
la app los muestra con la etiqueta **"aproximación — pendiente de validación comunitaria"**.

## Qué hay que validar

1. **Los patrones rítmicos** — ¿el toque suena/se nota como corresponde? ¿La grilla
   (12 vs 16), el rol de cada atabaque (Rum líder, Rumpi/Lé sostén) y la clave del Gã
   están bien?
2. **La terminología** — nombres de los toques, de los instrumentos, de las naciones
   (Ketu/Nagô, Angola, Jeje). El research **refutó** un mapeo específico toque→nación que
   circula online; no usar agrupamientos por nación sin respaldo.
3. **Qué es apropiado mostrar públicamente** — hay repertorio litúrgico que puede ser
   reservado. Preguntar antes de asumir que todo es exhibible.
4. **El encuadre y los créditos** — cómo nombrar la tradición, a quién acreditar, qué
   contexto dar para que no quede descontextualizado.

## Con quiénes validar (sin nombres propios; completar en doc privado)

- **Etnomusicólogos/as** especializados en percusión afrobrasileña (universidades con
  estudios afro; autores de las disertaciones citadas en el research).
- **Alabês / ogãs** (los percusionistas litúrgicos del Candomblé) o referentes de un
  terreiro dispuestos a comentar.
- **Escuelas / grupos de percusión afrobrasileña** en Argentina (hay comunidad de
  candombe y percusión afro en La Plata y Buenos Aires; algunos grupos trabajan toques
  de Candomblé).
- **Asociaciones culturales afro** que puedan orientar sobre el encuadre.

## Protocolo de acercamiento

- Presentar el proyecto **con humildad y sin fines de lucro declarados**: es una herramienta
  educativa/de portafolio, abierta a corrección.
- Pedir feedback puntual sobre los 4 puntos a validar. Ofrecer **atribución y crédito**
  explícitos a quien colabore (si acepta ser nombrado).
- **Estar dispuesto a cambiar o quitar** lo que pidan, incluido bajar un preset o cambiar
  un nombre. Dejarlo por escrito como compromiso.
- **No monetizar** el contenido cultural sin un acuerdo explícito con la comunidad.

## Checklist "no publicar como auténtico hasta que…"

- [ ] Al menos un/a referente con autoridad revisó los patrones y el encuadre.
- [ ] Los nombres de toques, instrumentos y naciones están confirmados.
- [ ] Se acordó qué se muestra y qué no.
- [ ] Los créditos y el contexto están redactados y aprobados.
- [ ] El disclaimer "aproximación didáctica" se reemplaza por la atribución real.

## Mientras tanto (qué hace la app hoy)

- Muestra los toques con etiqueta de **aproximación** + su fuente + el nivel de confianza.
- Incluye una nota breve de contexto cultural por toque (rol ritual, a qué se asocia),
  redactada con respeto.
- El README y la propia app enlazan a las fuentes etnomusicológicas usadas.

---
*Origen: research multiagente de 2026-06 + decisión de Martín de "encuadre + buscar
validación". Los datos de contacto concretos de interlocutores van en un doc privado,
fuera del repo público.*
