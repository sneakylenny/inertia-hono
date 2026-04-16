import { Hono } from 'hono'
import { createInertia, render, type InertiaVariables } from 'inertia-hono'
import { createHtmlRenderer } from './html.js'

const vitePort = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173
const viteOrigin = process.env.VITE_ORIGIN ?? `http://localhost:${vitePort}`
const isDev = process.env.NODE_ENV !== 'production'

const { middleware } = createInertia({
  version: '1',
  renderHtml: createHtmlRenderer({ viteOrigin, dev: isDev }),
})

export const app = new Hono<{ Variables: InertiaVariables }>()

app.use(middleware)

app.get('/', (c) => render(c, 'Home', { greeting: 'Hello from Inertia + Hono!' }))
