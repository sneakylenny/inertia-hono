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
    expect(html).toMatch(/http:\/\/localhost:\d+\/@vite\/client/)
    expect(html).toMatch(/http:\/\/localhost:\d+\/src\/inertia\/main\.ts/)
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
    expect(body.props.section).toBe('This page is intentionally slow to simulate a slow server response.')
  })

  it('merges share() layers on /shared-demo', async () => {
    const res = await playgroundApp.request('http://localhost/shared-demo', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'playground-1',
        'Accept': 'application/json',
      },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      component: string
      props: {
        appName?: string
        sharedViaMiddleware?: string
        sharedViaRouteHandler?: string
        fromRender?: string
      }
    }
    expect(body.component).toBe('SharedDemo')
    expect(body.props.appName).toBe('Inertia Hono playground')
    expect(body.props.sharedViaMiddleware).toContain('middleware')
    expect(body.props.sharedViaRouteHandler).toContain('GET handler')
    expect(body.props.fromRender).toContain('render()')
  })

  it('serves /deferred-demo: full visit omits defer props, lists deferredProps', async () => {
    const res = await playgroundApp.request('http://localhost/deferred-demo', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'playground-1',
        'Accept': 'application/json',
      },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      component: string
      props: {
        intro?: string
        primaryData?: unknown
        secondaryData?: unknown
        secondaryMore?: unknown
      }
      deferredProps?: Record<string, string[]>
    }
    expect(body.component).toBe('DeferredDemo')
    expect(body.props.intro).toContain('defer()')
    expect(body.props.primaryData).toBeUndefined()
    expect(body.props.secondaryData).toBeUndefined()
    expect(body.props.secondaryMore).toBeUndefined()
    expect(body.deferredProps).toEqual({
      default: ['primaryData'],
      secondary: ['secondaryData', 'secondaryMore'],
    })
  })

  it('serves /lazy-demo: full visit omits optional, includes lazy + always', async () => {
    const res = await playgroundApp.request('http://localhost/lazy-demo', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'playground-1',
        'Accept': 'application/json',
      },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      component: string
      props: {
        lazyMain?: { label: string }
        optionalChunk?: unknown
        alwaysMeta?: { label: string }
        appName?: string
      }
    }
    expect(body.component).toBe('PartialDemo')
    expect(body.props.lazyMain?.label).toBe('lazy()')
    expect(body.props.optionalChunk).toBeUndefined()
    expect(body.props.alwaysMeta?.label).toBe('always()')
    expect(body.props.appName).toBe('Inertia Hono playground')
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
