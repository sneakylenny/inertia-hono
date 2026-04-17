import { app } from './server.js'

const port = process.env.PORT ? Number(process.env.PORT) : 3000

console.log(`Server: http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
