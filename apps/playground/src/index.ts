import { playgroundApp } from './server.js'

const port = process.env.PORT ? Number(process.env.PORT) : 3000

export default {
  port,
  fetch: playgroundApp.fetch,
}

console.log(`Playground API: http://localhost:${port}`)
console.log(
  `Vite client:    ${process.env.PLAYGROUND_VITE_ORIGIN ?? 'http://localhost:5173'} (must be running in dev)`,
)
