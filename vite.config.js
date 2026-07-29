import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    basicSsl(),
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['agap_pwa_icon.png', 'apple-touch-icon.png', 'apple-touch-icon-precomposed.png', 'hero.svg', 'agap icon.svg', 'favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg', 'robots.txt'],
      manifest: {
        name: 'AGAP - Santa Rosa Disaster Response',
        short_name: 'AGAP',
        description: 'Advance Guidance & Assistance Platform for Santa Rosa City',
        theme_color: '#902715',
        background_color: '#902715',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'agap_pwa_icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'agap_pwa_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'agap_pwa_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,md,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
