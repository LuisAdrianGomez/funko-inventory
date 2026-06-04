/* eslint-env node */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // In development, base must be '/' so Vite resolves assets from localhost root.
  // In production (GitHub Pages), it must match /<repo-name>/.
  // Override with VITE_BASE_PATH if your repo has a different name.
  base: process.env.NODE_ENV === 'production'
    ? (process.env.VITE_BASE_PATH || '/funko-inventory/')
    : '/',
})
