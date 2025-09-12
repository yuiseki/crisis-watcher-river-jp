import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Set base for GitHub Pages: https://<user>.github.io/<repo>/
  base: '/crisis-watcher-river-jp/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
