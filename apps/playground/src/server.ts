import { Hono } from 'hono'
import {
  createInertia,
  type InertiaVariables,
} from 'inertia-hono'
import { createPlaygroundHtmlRenderer } from './inertia/playground-html.js'

const viteOrigin = process.env.PLAYGROUND_VITE_ORIGIN ?? 'http://localhost:5173'
const isDev = process.env.NODE_ENV !== 'production'

const { middleware, instance } = createInertia({
  version: 'playground-1',
  share: async () => ({ appName: 'Inertia Hono playground' }),
  renderHtml: createPlaygroundHtmlRenderer({
    viteOrigin,
    dev: isDev,
  }),
})

export const playgroundApp = new Hono<{ Variables: InertiaVariables }>()

playgroundApp.use(middleware)

playgroundApp.get('/', c =>
  instance.render(c, 'Index', {
    hint: 'Run `bun run dev` so Vite serves the Vue app on port 5173.',
  }),
)

playgroundApp.get('/about', c =>
  instance.render(c, 'About', { section: 'demo' }),
)
