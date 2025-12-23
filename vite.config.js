import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: false, // Отключаем загрузку .env файлов
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    host: 'localhost',
    port: 3008,
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
