import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1000, // Set to 1000KB as recommended
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделение на чанки для лучшей производительности
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
          charts: ['recharts']
        }
      }
    }
  }
})
