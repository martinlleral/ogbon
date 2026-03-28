# Ogbon — Círculos de Axé

## Qué es
App web para composición y visualización de ritmos de percusión afrobrasileña (Candomblé) con síntesis de audio en tiempo real.

## Stack
- React 19 + Vite 8
- Tailwind CSS 4
- Web Audio API (síntesis FM + membrana física)
- Canvas API (visualización circular + ondas)
- Supabase (almacenamiento de presets en la nube)

## Estructura
```
src/
├── main.jsx
├── index.css
├── audio/
│   ├── engine.js      # Motor de síntesis y secuenciador (Web Audio API)
│   └── presets.js     # Gestión de presets (Supabase, localStorage, internos)
└── components/
    ├── Ogbon.jsx          # Componente principal (estado, controls)
    ├── CircleCanvas.jsx   # Visualización circular interactiva
    └── WaveCanvas.jsx     # Ondas de forma maestra
```

## Deploy
- GitHub Pages via GitHub Actions (push a main → deploy automático)
- Base path: `/ogbon/`
- URL: https://martinlleral.github.io/ogbon

## Seguridad
- Credenciales Supabase en `.env` (no commitear)
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`
- GitHub Actions usa secrets para el build

## Convenciones
- Componentes React con hooks funcionales
- Audio engine separado de UI
- Grilla musical: 12/8 ternaria o 4/4 cuaternaria
- Instrumentos: Gã (metal), Rum, Rumpi, Lé (atabaques)
