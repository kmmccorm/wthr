import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Asset base path. Netlify serves at root ('/'); GitHub Pages serves under
  // '/wthr/' and sets VITE_BASE in its deploy workflow.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: {
    proxy: {
      // Forward API calls to the signing proxy (server/index.js).
      '/api': 'http://localhost:8787',
    },
  },
})
