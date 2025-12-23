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
    host: 'localhost',
    port: 3008,
    open: false,
    proxy: {
      '/supabase-api': {
        target: 'https://lwgnyerzimcajauxzowx.supabase.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/supabase-api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Supabase proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying Supabase request to:', proxyReq.path);
            // Add CORS headers to request
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Supabase proxy response:', proxyRes.statusCode);
            // Add CORS headers to response
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, apikey';
          });
        }
      }
    }
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
