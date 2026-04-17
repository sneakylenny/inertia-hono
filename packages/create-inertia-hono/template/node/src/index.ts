import { serve } from '@hono/node-server'
import { app } from './server.js'

const port = process.env.PORT ? Number(process.env.PORT) : 3000

serve({ fetch: app.fetch, port }, ({ port }) => {
  console.log(`Server: http://localhost:${port}`)
})
