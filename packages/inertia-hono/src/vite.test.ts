import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import {
  createInertia,
  createViteHtmlRenderer,
  render,
  type InertiaVariables,
  type ViteManifest,
} from './index.js'

async function firstVisit(app: Hono, path = '/hello') {
  const res = await app.request(`http://localhost${path}`, {
    headers: { Accept: 'text/html' },
  })
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toMatch(/text\/html/)
  return await res.text()
}

function makeApp(renderHtml: ReturnType<typeof createViteHtmlRenderer>) {
  const { middleware } = createInertia({ version: '1', renderHtml })
  const app = new Hono<{ Variables: InertiaVariables }>()
  app.use(middleware)
  app.get('/hello', c => render(c, 'Hello', { name: 'Tim' }))
  return app
}

describe('createViteHtmlRenderer — dev mode', () => {
  it('injects @vite/client and the dev entry script', async () => {
    const app = makeApp(
      createViteHtmlRenderer({
        dev: true,
        entry: 'src/inertia/main.ts',
      }),
    )

    const html = await firstVisit(app)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('http://localhost:5173/@vite/client')
    expect(html).toContain('http://localhost:5173/src/inertia/main.ts')
    expect(html).toContain('data-page="app"')
    expect(html).toContain('"component":"Hello"')
    expect(html).toContain('<div id="app"></div>')
  })

  it('honors custom viteOrigin, htmlAttrs, bodyClass, and title', async () => {
    const app = makeApp(
      createViteHtmlRenderer({
        dev: true,
        viteOrigin: 'https://vite.example.com:4173/',
        entry: 'src/main.ts',
        htmlAttrs: { 'data-theme': 'dark' },
        bodyClass: 'min-h-screen bg-base-200',
        title: page => `${page.component} · MyApp`,
      }),
    )

    const html = await firstVisit(app)
    expect(html).toContain('https://vite.example.com:4173/@vite/client')
    expect(html).toContain('https://vite.example.com:4173/src/main.ts')
    expect(html).toContain('data-theme="dark"')
    expect(html).toContain('class="min-h-screen bg-base-200"')
    expect(html).toContain('<title>Hello · MyApp</title>')
  })

  it('injects the React refresh preamble when requested', async () => {
    const app = makeApp(
      createViteHtmlRenderer({
        dev: true,
        reactRefresh: true,
      }),
    )

    const html = await firstVisit(app)
    expect(html).toContain('@react-refresh')
    expect(html).toContain('RefreshRuntime.injectIntoGlobalHook')
  })

  it('escapes </script> in the embedded page JSON', async () => {
    const { middleware } = createInertia({
      version: '1',
      renderHtml: createViteHtmlRenderer({ dev: true }),
    })
    const app = new Hono<{ Variables: InertiaVariables }>()
    app.use(middleware)
    app.get('/', c =>
      render(c, 'Evil', { payload: '</script><script>alert(1)</script>' }),
    )

    const res = await app.request('http://localhost/', { headers: { Accept: 'text/html' } })
    const html = await res.text()
    expect(html).not.toContain('</script><script>alert(1)')
    expect(html).toContain('\\u003c/script')
  })
})

describe('createViteHtmlRenderer — production mode', () => {
  const manifest: ViteManifest = {
    'src/main.ts': {
      file: 'assets/main-abc123.js',
      src: 'src/main.ts',
      isEntry: true,
      css: ['assets/main-abc123.css'],
    },
  }

  it('emits production <script> + <link> from the Vite manifest', async () => {
    const app = makeApp(
      createViteHtmlRenderer({
        dev: false,
        manifest,
        entry: 'src/main.ts',
      }),
    )

    const html = await firstVisit(app)
    expect(html).not.toContain('@vite/client')
    expect(html).toContain('src="/assets/main-abc123.js"')
    expect(html).toContain('href="/assets/main-abc123.css"')
    expect(html).toContain('crossorigin')
  })

  it('respects a custom base path', async () => {
    const app = makeApp(
      createViteHtmlRenderer({
        dev: false,
        manifest,
        entry: 'src/main.ts',
        base: '/static',
      }),
    )

    const html = await firstVisit(app)
    expect(html).toContain('src="/static/assets/main-abc123.js"')
    expect(html).toContain('href="/static/assets/main-abc123.css"')
  })

  it('allows overriding prodScriptSrc and prodStyleHref without a manifest', async () => {
    const app = makeApp(
      createViteHtmlRenderer({
        dev: false,
        prodScriptSrc: 'https://cdn.example.com/app.js',
        prodStyleHref: ['/style-a.css', '/style-b.css'],
      }),
    )

    const html = await firstVisit(app)
    expect(html).toContain('src="https://cdn.example.com/app.js"')
    expect(html).toContain('href="/style-a.css"')
    expect(html).toContain('href="/style-b.css"')
  })

  it('throws a helpful error when production assets cannot be resolved', async () => {
    const renderHtml = createViteHtmlRenderer({
      dev: false,
      manifest: {},
      entry: 'src/missing.ts',
    })

    await expect(
      renderHtml({
        page: {
          component: 'Hello',
          props: {},
          url: '/',
          version: '1',
        },
        pageJson: '{}',
        rootElementId: 'app',
        pageScriptDataAttribute: 'app',
      }),
    ).rejects.toThrow(/manifest entry "src\/missing\.ts" not found/i)
  })
})
