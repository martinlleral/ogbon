import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Ogbon from './components/Ogbon'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Ogbon />
  </StrictMode>,
)
