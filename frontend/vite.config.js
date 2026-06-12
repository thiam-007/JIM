import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['images/logo.jpeg'],
      manifest: {
        name: "MVG Event's — Musée Virtuel de Guinée",
        short_name: "MVG Event's",
        description: 'Application de gestion des événements du Musée Virtuel de Guinée',
        theme_color: '#5c3519',
        background_color: '#fef9f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpeg,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.airtable\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'airtable-api', networkTimeoutSeconds: 10 }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
