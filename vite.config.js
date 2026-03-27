import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        id: '/',
        start_url: '/',
        scope: '/',
        name: 'Eastern Vacations System',
        short_name: 'EV System',
        description: 'Enterprise Management System for Eastern Vacations Safari & Tours',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '640x640',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '640x640',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
         skipWaiting: true,
         clientsClaim: true,
         cleanupOutdatedCaches: true,
         // Aggressively cache the entire site locally for near instant boot speeds
         globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
         maximumFileSizeToCacheInBytes: 5242880 // 5MiB
      }
    })
  ]
});
