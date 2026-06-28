import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Ogbon from './components/Ogbon'
import { setupPWA } from './pwa'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Ogbon />
  </StrictMode>,
)

// Registro del Service Worker con actualizaciones confiables (ver src/pwa.js).
setupPWA()
