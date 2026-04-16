import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const port = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  appType: 'spa',
  root: resolve(import.meta.dirname),
  server: {
    port,
    strictPort: true,
    cors: true,
    origin: `http://localhost:${port}`,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'index.html'),
    },
  },
})
