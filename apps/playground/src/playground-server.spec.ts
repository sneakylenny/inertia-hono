/** Node fetch/Headers match production Hono responses (happy-dom strips some headers). */
// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { playgroundApp } from './server.js'

describe('playground Hono + Inertia HTML shell', () => {
  it('serves a full page with Index component and Vite module entries', async () => {
    const res = await playgroundApp.request('http://localhost/', {
      headers: { Accept: 'text/html' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/html/)

    const html = await res.text()
    expect(html).toContain('"component":"Index"')
    expect(html).toContain('data-page="app"')
    expect(html).toContain('type="application/json"')
    expect(html).toContain('http://localhost:5173/@vite/client')
    expect(html).toContain('http://localhost:5173/src/inertia/main.ts')
  })

  it('returns JSON for Inertia visits', async () => {
    const res = await playgroundApp.request('http://localhost/about', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'playground-1',
        'Accept': 'application/json',
      },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('x-inertia')).toBe('true')
    const body = (await res.json()) as { component: string, props: { section?: string } }
    expect(body.component).toBe('About')
    expect(body.props.section).toBe('demo')
  })

  it('should partially reload on /todos and return only todos (plus errors)', async () => {
    const res = await playgroundApp.request('http://localhost/todos', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'playground-1',
        'X-Inertia-Partial-Component': 'Todos',
        'X-Inertia-Partial-Data': 'todos',
        'Accept': 'application/json',
      },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      props: { todos?: unknown[], appName?: string, errors: unknown }
    }
    expect(Array.isArray(body.props.todos)).toBe(true)
    expect(body.props.errors).toEqual({})
    expect(body.props.appName).toBeUndefined()
  })
})
