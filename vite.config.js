import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-*.png'],
      manifest: {
        name: 'OnStream – Free Streaming',
        short_name: 'OnStream',
        description: 'Watch free movies & TV shows in HD – no login, no subscription.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        screenshots: [
          { src: '/screenshot-wide.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
          { src: '/screenshot-narrow.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' }
        ],
        categories: ['entertainment', 'video'],
        shortcuts: [
          { name: 'Movies', short_name: 'Movies', url: '/?tab=movies', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: 'TV Shows', short_name: 'Shows', url: '/?tab=shows', icons: [{ src: '/icon-192.png', sizes: '192x192' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.themoviedb\.org\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'tmdb-api-cache', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 } }
          },
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'tmdb-images-cache', expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ]
      }
    })
  ]
})
