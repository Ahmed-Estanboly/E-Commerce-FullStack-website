import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    allowedHosts: [
      'maximus-backed-umbilically.ngrok-free.dev'
    ],
    proxy: {
      // Forward all /api requests to your local backend
      '/api': {
        target: 'http://localhost:3000', // Change to your backend port
        changeOrigin: true,
      }
    }
  }
})
