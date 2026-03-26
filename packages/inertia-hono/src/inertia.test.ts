import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import {
  createInertia,
  share,
  type InertiaVariables,
} from './index.js'

describe('createInertia', () => {
  it('returns HTML for first visit and JSON for Inertia request', async () => {
    const { middleware } = createInertia({ version: 'abc' })
    const app = new Hono<{ Variables: InertiaVariables }>()
    app.use(middleware)
    app.get('/hello', c => c.var.inertia.render(c, 'Hello', { name: 'Tim' }))

    const htmlRes = await app.request('http://localhost/hello')
    expect(htmlRes.status).toBe(200)
    expect(htmlRes.headers.get('content-type')).toMatch(/text\/html/)
    const html = await htmlRes.text()
    expect(html).toContain('"component":"Hello"')

    const jsonRes = await app.request('http://localhost/hello', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'abc',
      },
    })
    expect(jsonRes.status).toBe(200)
    expect(jsonRes.headers.get('x-inertia')).toBe('true')
    expect(jsonRes.headers.get('vary')).toBe('X-Inertia')
    const body = (await jsonRes.json()) as {
      component: string
      props: Record<string, unknown>
    }
    expect(body.component).toBe('Hello')
    expect(body.props.name).toBe('Tim')
  })

  it('returns 409 when version mismatches on GET', async () => {
    const { middleware } = createInertia({ version: 'new' })
    const app = new Hono<{ Variables: InertiaVariables }>()
    app.use(middleware)
    app.get('/', c => c.var.inertia.render(c, 'Home', {}))

    const res = await app.request('http://localhost/', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'old',
      },
    })
    expect(res.status).toBe(409)
    expect(res.headers.get('x-inertia-location')).toBe('http://localhost/')
  })

  it('merges share() and inertia.share() into render props', async () => {
    const { middleware } = createInertia({
      version: 'v1',
      share: async () => ({ fromOptions: true }),
    })
    const app = new Hono<{ Variables: InertiaVariables }>()
    app.use(async (c, next) => {
      share(c, { fromHelper: 'a' })
      await next()
    })
    app.use(middleware)
    app.get('/', c => {
      c.var.inertia.share(c, { fromInstance: 1 })
      return c.var.inertia.render(c, 'Home', { fromRender: 2 })
    })

    const res = await app.request('http://localhost/', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'v1',
      },
    })
    const body = (await res.json()) as {
      props: Record<string, unknown>
    }
    expect(body.props.fromOptions).toBe(true)
    expect(body.props.fromHelper).toBe('a')
    expect(body.props.fromInstance).toBe(1)
    expect(body.props.fromRender).toBe(2)
  })
})
