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

const isDev = process.env.NODE_ENV !== 'production'
const distRoot = resolve(join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist'))

export const app = new Hono<{ Variables: InertiaVariables }>()

if (!isDev && typeof Bun !== 'undefined') {
  const { serveStatic } = await import('hono/bun')
  app.use('/assets/*', serveStatic({ root: distRoot }))
}

const { middleware } = createInertia({
  version: '1',
  renderHtml: createViteHtmlRenderer({
    dev: isDev,
    entry: 'src/inertia/main.ts',
    manifest: isDev ? null : await readViteManifest(distRoot),
  }),
})

app.use(middleware)

app.get('/', c => render(c, 'Home', { greeting: 'Hello from Inertia + Hono!' }))
