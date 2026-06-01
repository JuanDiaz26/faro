import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Faro — Finanzas + Hábitos',
        short_name: 'Faro',
        description: 'El faro que te guía con tus finanzas y hábitos personales.',
        theme_color: '#0B1733',
        background_color: '#0B1733',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es-AR',
        categories: ['finance', 'productivity', 'lifestyle'],
        icons: [
          { src: 'pwa-64x64.png',  sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Nuevo gasto', short_name: 'Gasto', url: '/?action=new-expense', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Historial',   short_name: 'Historial', url: '/history',     icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Ahorro',      short_name: 'Ahorro',    url: '/savings',     icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // El backend Express es separado: no cacheamos /api en SW
        // (lo dejamos network-only para que siempre veas datos frescos).
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // No activamos SW en dev por defecto — evita cache molesta mientras editamos.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
