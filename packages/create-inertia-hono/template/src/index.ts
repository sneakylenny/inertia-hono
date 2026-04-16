import { app } from './server.js'

const port = process.env.PORT ? Number(process.env.PORT) : 3000

export default {
  port,
  fetch: app.fetch,
}

console.log(`Server: http://localhost:${port}`)
