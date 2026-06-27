# Ogbon — Círculos de Axé

## Qué es
App web para composición y visualización de ritmos de percusión afrobrasileña (Candomblé) con síntesis de audio en tiempo real.

## Stack
- React 19 + Vite 8
- Tailwind CSS 4
- Web Audio API (síntesis FM + membrana física)
- Canvas API (visualización circular + ondas)
- Presets: built-in (en código) + localStorage + import/export de archivos `.ogbon`
  (sin backend; 100% offline)

## Estructura
```
src/
├── main.jsx
├── index.css
├── audio/
│   ├── engine.js      # Motor de síntesis y secuenciador (Web Audio API)
│   └── presets.js     # Gestión de presets (built-in, localStorage, import/export)
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
- Sin backend ni credenciales: la app es 100% estática y offline.
- No se commitea `.env` ni secretos (no hacen falta).

## Cultura
- Ogbón representa percusión sagrada de Candomblé (tradición religiosa viva).
- Los presets son aproximaciones didácticas con fuente y nivel de confianza declarados.
- Ver `docs/VALIDACION-CULTURAL.md` antes de publicar presets como "auténticos".

## Convenciones
- Componentes React con hooks funcionales
- Audio engine separado de UI
- Grilla musical: 12/8 ternaria o 4/4 cuaternaria
- Instrumentos: Gã (metal), Rum, Rumpi, Lé (atabaques)
