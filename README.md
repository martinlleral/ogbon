# Ogbón: Círculos de Axé

Aplicación web interactiva para visualizar y componer ritmos de percusión afrobrasileña
(**Candomblé**), representando los tres tambores tradicionales (Rum, Rumpi y Lé) y la
campana (Gã/agogô) como círculos concéntricos, con síntesis de audio en tiempo real.

## Sobre la tradición (leer primero)

Ogbón representa **percusión sagrada de Candomblé**, una religión de matriz africana
**viva**. No es una "drum machine exótica": es una herramienta educativa que busca
honrar la tradición. Los toques incluidos son **aproximaciones didácticas** con su
fuente y nivel de confianza declarados — el gã (campana) tiene respaldo en notación
publicada; los patrones de atabaque son reconstrucciones a partir de descripciones
etnomusicológicas, **pendientes de validación con la comunidad**. Ver
[`docs/VALIDACION-CULTURAL.md`](docs/VALIDACION-CULTURAL.md).

## Stack

- **React 19** + **Vite 8**
- **Tailwind CSS 4**
- **Web Audio API** — síntesis FM inarmónica para la campana + membrana física con
  pitch-bend para los atabaques (sin samples)
- **Canvas API** — visualización circular y forma de onda, nítida en pantallas retina
- **Sin backend**: presets built-in + `localStorage` + archivos `.ogbon`. 100% offline.

## Funcionalidades

- Composición sobre círculos interactivos para 4 instrumentos (Gã, Rum, Rumpi, Lé)
- Toques built-in con contexto cultural: **Ijexá** (Oxum), **Aguerê** (Oxóssi),
  **Vassi** (linha-guia colectiva)
- Síntesis realista en tiempo real; pulso preciso (scheduler look-ahead)
- Visualización dual: ondas paralelas por instrumento y onda transcendental maestra
- Efectos visuales: pulsos neón, haces de luz, anillos brillantes
- Control de BPM, grilla (12/8 ternaria, 4/4 cuaternaria), compases y mixer de ganancia
- Presets propios en el navegador + exportación/importación de archivos `.ogbon`
- Scrubbing táctil: arrastrar sobre el círculo para previsualizar

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run build
npm run preview
```

## Documentación

- [`CHANGELOG.md`](CHANGELOG.md) — mapa de versiones
- [`docs/RESEARCH.md`](docs/RESEARCH.md) — informe de investigación (UX, audio, cultura)
- [`docs/VALIDACION-CULTURAL.md`](docs/VALIDACION-CULTURAL.md) — plan de validación comunitaria

## Demo

[Ver demo en vivo](https://martinlleral.github.io/ogbon)

## Fuentes y créditos

Los patrones y su contexto se basan en: Megna 2021 (George Mason University), Candemil 2017
(UDESC), Farias 2021 (*Claves Afro-Brasileiras*, UNIRIO), Lühning 1990, Kubik 1979 y
Redmond 2009 (Percussive Arts Society). Agradecimiento a la tradición del Candomblé Ketu,
Angola y Jeje, y a quienes la sostienen y enseñan.

## Autor

Martín Lleral — [GitHub](https://github.com/martinlleral)
