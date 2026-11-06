import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['noteku-icon.svg'],
      manifest: {
        name: 'NoteKu — Catatan Kuliah',
        short_name: 'NoteKu',
        description: 'Simpan dan kelola catatan kuliah.',
        theme_color: '#f7f9fb',
        background_color: '#f7f9fb',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/noteku-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,webmanifest,woff2}'],
      },
    }),
  ],
})
