import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/logo.jpeg'],
      manifest: {
        name: 'JIM 2026 — Musée Virtuel de Guinée',
        short_name: 'JIM 2026',
        description: 'Application de gestion de la Journée Internationale des Musées 2026',
        theme_color: '#5c3519',
        background_color: '#fef9f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/images/logo.jpeg', sizes: '192x192', type: 'image/jpeg' },
          { src: '/images/logo.jpeg', sizes: '512x512', type: 'image/jpeg' }
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
      }
    })
  ]
})
