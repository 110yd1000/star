import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      jsxRuntime: 'automatic'
    })
  ],
  server: {
    proxy: {
      // Main API endpoints for ads
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url, '→', proxyReq.path);
          });
        }
      },
      
      // Accounts endpoints
      '/accounts': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      },
      
      // Health check endpoint
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      },
      
      // API documentation endpoints
      '/swagger': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      },
      
      '/redoc': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      },
      
      // Django static/media files (if needed)
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      },
      
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      }
    },
    
    // Optional: Configure CORS if needed
    cors: true,
    
    // Optional: Configure port (default is 5173)
    // port: 5174,
    
    // Optional: Configure host
    // host: true, // to expose to network
  }
})