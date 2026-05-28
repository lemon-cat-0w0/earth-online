import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/earth-online/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: null,
    includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
    manifest: {
      name: '地球Online指南',
      short_name: '地球Online',
      description: '个人生活、成长、工作与爱好的专属助手',
      theme_color: '#f5f0eb',
      background_color: '#f5f0eb',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/earth-online/',
      icons: [
        {
          src: '/earth-online/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/earth-online/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
    }
  })],
  server: {
    port: 3000
  }
})