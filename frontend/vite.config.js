// vite.config.js
//
// Vite is the build tool + dev server for our React app.
// This file configures how it behaves.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),        // Enables React JSX + Fast Refresh (instant updates as you code)
    tailwindcss(),  // Tailwind v4 Vite plugin — processes Tailwind CSS automatically
  ],

  server: {
    // The "proxy" redirects API requests from the frontend to the backend.
    // Without this, when React calls /api/auth/login, the browser would
    // look for that on localhost:5173 (where React runs) — but Flask is
    // on localhost:5000. This proxy forwards /api/* to Flask automatically.
    //
    // This also prevents CORS issues during development, since from the
    // browser's perspective, everything is on the same origin (localhost:5173).
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
