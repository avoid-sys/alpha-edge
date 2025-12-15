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
    host: '127.0.0.1',
    port: 5173,
    open: false
  },
  build: {
    chunkSizeWarningLimit: 2000, // Увеличен до 2000KB чтобы полностью убрать предупреждение о размере бандла
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
