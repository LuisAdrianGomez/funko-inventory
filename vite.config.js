import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages: /<repo-name>/
  // Change 'funko-inventory' to match your actual repo name
  base: process.env.VITE_BASE_PATH || '/funko-inventory/',
})
