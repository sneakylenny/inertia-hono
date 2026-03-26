import { playgroundApp } from './server.js'

const port = process.env.PLAYGROUND_PORT ? Number(process.env.PLAYGROUND_PORT) : 3000
const vitePort = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173

export default {
  port,
  fetch: playgroundApp.fetch,
}

console.log(`Playground API: http://localhost:${port}`)
console.log(
  `Vite client:    ${process.env.PLAYGROUND_VITE_ORIGIN ?? `http://localhost:${vitePort}`} (must be running in dev)`,
)
