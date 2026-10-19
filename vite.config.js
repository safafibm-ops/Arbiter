import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE sets the path the site is served from, e.g. /projects/arbiter/ inside a portfolio.
// Use './' for a build that works from any folder (pair it with VITE_ROUTER=hash).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
})
