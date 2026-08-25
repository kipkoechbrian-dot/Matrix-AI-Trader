import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // When the FastAPI backend isn't running, answer with a clean 503
        // instead of dumping ECONNREFUSED stack traces into the terminal.
        // The frontend treats this as "simulated feed mode".
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (res && res.writeHead && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ detail: 'API offline — simulated feed active' }))
            } else if (req && req.socket) {
              req.socket.destroy()
            }
          })
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // Split heavy vendors so the landing page paints fast and the
        // terminal modules load on demand — real-world website behavior.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui'
          if (id.includes('lightweight-charts')) return 'charting'
          if (id.includes('recharts') || id.includes('d3-')) return 'graphs'
          if (id.includes('react-router')) return 'router'
          return 'vendor'
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
})
