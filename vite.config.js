import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API calls to the signing proxy (server/index.js).
      '/api': 'http://localhost:8787',
    },
  },
})
