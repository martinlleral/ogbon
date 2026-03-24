# Ogbón: Círculos de Axé

Aplicación web interactiva para visualizar y componer ritmos de percusión afrobrasileña (Candomblé), representando los tres tambores tradicionales (Rum, Rumpi y Lé) como círculos concéntricos con síntesis de audio en tiempo real.

## Stack

- **React 19** + **Vite 8**
- **Tailwind CSS 4** para estilos
- **Web Audio API** (síntesis FM de campana + membrana física para atabaques)
- **Canvas API** (visualización circular y forma de onda)
- **Supabase** (almacenamiento de presets en la nube)

## Funcionalidades

- Composición de patrones rítmicos sobre círculos interactivos para 4 instrumentos (Gã, Rum, Rumpi, Lé)
- Síntesis de audio realista: FM/inarmónica para campana, membrana física con pitch bend para atabaques
- Visualización dual: ondas paralelas por instrumento y onda transcendental maestra
- Efectos visuales: pulsos neón, haces de luz, anillos brillantes
- Control de BPM, grilla (12/8 ternaria, 4/4 cuaternaria), compases y mixer de ganancia
- Presets: internos, desde Supabase (nube) y localStorage
- Exportación/importación de ritmos como archivos `.ogbon`
- Scrubbing táctil: arrastrar sobre el círculo para previsualizar
- Diseño responsive

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Demo

[Ver demo en vivo](https://martinlleral.github.io/ogbon)

## Autor

Martín Lleral - [GitHub](https://github.com/martinlleral)
