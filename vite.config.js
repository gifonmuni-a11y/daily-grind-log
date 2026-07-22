import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: false,
      workbox: {
        // Mengatur pola file yang dicari saat build (disesuaikan dengan file milikmu)
        globPatterns: ['**/*.{js,css,html,png,gif,json}'],
        
        // Mencegah error build (Vercel) jika ada tipe file yang kosong
        globStrict: false,
        
        runtimeCaching: [],
        skipWaiting: true,
        clientsClaim: true,
        
        // MENYUNTIKKAN SCRIPT PENANGKAP PUSH NOTIFIKASI SECARA PERMANEN
        importScripts: ['/custom-push.js']
      }
    })
  ]
})
