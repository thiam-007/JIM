import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['images/favicon.png'],
      manifest: {
        name: "MVG Community — Musée Virtuel de Guinée",
        short_name: "MVG Community",
        description: "Application d'actualité et communautaire du Musée Virtuel de Guinée",
        theme_color: '#28336f',
        background_color: '#f4f7f5',
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
