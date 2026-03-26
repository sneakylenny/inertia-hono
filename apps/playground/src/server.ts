import { Hono } from 'hono'
import { createInertia, type InertiaVariables } from 'inertia-hono'
import sharedDemoRouter from './app/shared-demo/shared-demo.router.js'
import todoRouter from './app/todo/todo.router.js'
import { createPlaygroundHtmlRenderer } from './inertia/playground-html.js'

const vitePort = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173
const viteOrigin = process.env.PLAYGROUND_VITE_ORIGIN ?? `http://localhost:${vitePort}`
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
    hint: `Run \`bun run dev\` so Vite serves the Vue app on port ${vitePort}.`,
  }),
)

playgroundApp.get('/about', c =>
  instance.render(c, 'About', { section: 'demo' }),
)

playgroundApp.route('/', sharedDemoRouter)
playgroundApp.route('/', todoRouter)
