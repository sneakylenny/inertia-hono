import { Hono } from 'hono'
import { createInertia, render, type InertiaVariables } from 'inertia-hono'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import deferredDemoRouter from './app/deferred-demo/deferred-demo.router.js'
import lazyDemoRouter from './app/partial-demo/partial-demo.router.js'
import sharedDemoRouter from './app/shared-demo/shared-demo.router.js'
import todoRouter from './app/todo/todo.router.js'
import redirectDemoRouter from './app/redirect-demo/redirect-demo.router.js'
import { createPlaygroundHtmlRenderer } from './inertia/playground-html.js'
import { readProdClientAssets } from './prod-client-assets.js'

const vitePort = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173
const viteOrigin = process.env.PLAYGROUND_VITE_ORIGIN ?? `http://localhost:${vitePort}`
const isDev = process.env.NODE_ENV !== 'production'

const distRoot = resolve(join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist'))
const prodAssets = !isDev ? readProdClientAssets(distRoot) : null

export const playgroundApp = new Hono<{ Variables: InertiaVariables }>()

if (!isDev && typeof Bun !== 'undefined') {
  const { serveStatic } = await import('hono/bun')
  playgroundApp.use('/assets/*', serveStatic({ root: distRoot }))
}

const { middleware } = createInertia({
  version: 'playground-1',
  share: async () => ({ appName: 'Inertia Hono playground' }),
  renderHtml: createPlaygroundHtmlRenderer({
    viteOrigin,
    dev: isDev,
    prodScriptSrc: prodAssets?.scriptSrc,
    prodStyleHref: prodAssets?.styleHref,
  }),
})

playgroundApp.use(middleware)

playgroundApp.get('/', c =>
  render(c, 'Index', {
    hint: `Welcome to the Inertia Hono playground! Use the navigation above to explore example features. Start the Vite dev server with \`bun run dev\` if you plan to make frontend changes.`,
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
