import { playgroundApp } from './server.js'

const port = process.env.PLAYGROUND_PORT ? Number(process.env.PLAYGROUND_PORT) : 3000
const vitePort = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173

export default {
  port,
  fetch: playgroundApp.fetch,
  // // Bun defaults to a 10s request idle timeout, which could be too short for SSE.
  // idleTimeout: 255,
}

console.log(`Playground: http://localhost:${port}`)

if (process.env.NODE_ENV !== 'production') {
  console.log(
    `Vite dev: ${process.env.PLAYGROUND_VITE_ORIGIN ?? `http://localhost:${vitePort}`} (run \`bun run dev\` for HMR)`,
  )
}
