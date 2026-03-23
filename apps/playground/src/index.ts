import { Hono } from 'hono'
import {
  createInertia,
  type InertiaVariables,
} from 'inertia-hono'

const { middleware, instance } = createInertia({
  version: 'playground-1',
  share: async () => ({ appName: 'Inertia Hono playground' }),
})

const app = new Hono<{ Variables: InertiaVariables }>()

app.use(middleware)

app.get('/', (c) =>
  instance.render(c, 'Welcome', {
    hint: 'Send X-Inertia: true and X-Inertia-Version: playground-1 for JSON.',
  }),
)

app.get('/about', (c) => instance.render(c, 'About', { section: 'demo' }))

const port = Number(process.env.PORT) || 3000

export default {
  port,
  fetch: app.fetch,
}

console.log(`Playground: http://localhost:${port}`)
