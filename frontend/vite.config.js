import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['noesis.thebuildguild.dev'],
    watch: {
      // Required for hot reload inside Docker volume mounts
      usePolling: true
    }
  },
  optimizeDeps: {
    // Explicit entry so Vite can pre-bundle deps even when index.html is not
    // yet readable at startup (e.g. inside a Docker volume mount).
    entries: ['src/main.jsx']
  }
})
