import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ogbon/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registramos el SW a mano (src/pwa.js) para bypassar el caché de 10 min que GitHub Pages
      // pone sobre sw.js (updateViaCache: 'none') y aplicar las actualizaciones a tiempo.
      // (No tocamos `workbox`: así se conservan los defaults de autoUpdate skipWaiting+clientsClaim.)
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ogbón: Círculos de Axé',
        short_name: 'Ogbón',
        description: 'Secuenciador de ritmos de percusión de Candomblé (Web Audio + Canvas).',
        lang: 'es',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
})
