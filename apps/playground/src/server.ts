import { Hono } from 'hono'
import {
  createInertia,
  createViteHtmlRenderer,
  readViteManifest,
  render,
  type InertiaVariables,
} from 'inertia-hono'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import deferredDemoRouter from './app/demos/deferred/deferred.router.js'
import lazyDemoRouter from './app/demos/partial/partial.router.js'
import sharedDemoRouter from './app/demos/shared/shared.router.js'
import todoRouter from './app/demos/todo/todo.router.js'
import redirectDemoRouter from './app/demos/redirect/redirect.router.js'

const vitePort = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173
const viteOrigin = process.env.PLAYGROUND_VITE_ORIGIN ?? `http://localhost:${vitePort}`
const isDev = process.env.NODE_ENV !== 'production'

const distRoot = resolve(join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist'))
const manifest = isDev ? null : await readViteManifest(distRoot)

export const playgroundApp = new Hono<{ Variables: InertiaVariables }>()

if (!isDev && typeof Bun !== 'undefined') {
  const { serveStatic } = await import('hono/bun')
  playgroundApp.use('/assets/*', serveStatic({ root: distRoot }))
}

const flashSecret
  = process.env.PLAYGROUND_FLASH_SECRET
    ?? (isDev ? 'playground-dev-flash-secret' : undefined)

if (!flashSecret) {
  throw new Error(
    'PLAYGROUND_FLASH_SECRET is required in production to sign Inertia flash cookies.',
  )
}

const { middleware } = createInertia({
  version: 'playground-1',
  flashSecret,
  share: async () => ({ appName: 'Inertia Hono playground' }),
  renderHtml: createViteHtmlRenderer({
    dev: isDev,
    viteOrigin,
    entry: 'src/inertia/main.ts',
    manifest,
    htmlAttrs: { 'data-theme': 'light' },
    bodyClass: 'min-h-screen bg-base-200',
  }),
})

playgroundApp.use(middleware)

playgroundApp.get('/', c =>
  render(c, 'Index', {
    hint: `Welcome to the Inertia Hono playground! Use the navigation on the left to explore example features. Start the Vite dev server with \`bun run dev\` if you plan to make frontend changes.`,
  }),
)

playgroundApp.get('/about', async (c) => {
  await new Promise(resolve => setTimeout(resolve, 500))

  return render(c, 'About', { section: 'This page is intentionally slow to simulate a slow server response.' })
})

playgroundApp.route('/', sharedDemoRouter)
playgroundApp.route('/', todoRouter)
playgroundApp.route('/', lazyDemoRouter)
playgroundApp.route('/', deferredDemoRouter)
playgroundApp.route('/', redirectDemoRouter)
