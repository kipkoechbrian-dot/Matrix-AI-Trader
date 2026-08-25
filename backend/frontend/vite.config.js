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
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
})
