import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createInertia, sse, type InertiaVariables } from './index.js'

function makeApp(opts?: Parameters<typeof createInertia>[0]) {
  const { middleware } = createInertia({
    version: 'v1',
    ...opts,
  })
  const app = new Hono<{ Variables: InertiaVariables }>()
  app.use(middleware)
  return app
}

describe('sse()', () => {
  it('returns an event-stream response and JSON-encodes object payloads', async () => {
    const app = makeApp()
    app.get('/events', c =>
      sse(c, async (send) => {
        await send({ ok: true }, {
          event: 'message',
          id: '1',
          retry: 5000,
        })
      }))

    const res = await app.request('http://localhost/events')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    expect(res.headers.get('cache-control')).toBe('no-cache, no-transform')
    expect(res.headers.get('x-accel-buffering')).toBe('no')

    const text = await res.text()
    expect(text).toContain('event: message')
    expect(text).toContain('id: 1')
    expect(text).toContain('retry: 5000')
    expect(text).toContain('data: {"ok":true}')
  })

  it('is available on c.var.inertia for request-scoped usage', async () => {
    const app = makeApp()
    app.get('/bound-events', c =>
      c.var.inertia.sse(async (send) => {
        await send('pong', { event: 'ping' })
      }, {
        headers: { 'x-custom-sse': 'yes' },
      }))

    const res = await app.request('http://localhost/bound-events')

    expect(res.status).toBe(200)
    expect(res.headers.get('x-custom-sse')).toBe('yes')

    const text = await res.text()
    expect(text).toContain('event: ping')
    expect(text).toContain('data: pong')
  })

  it('supports a configurable heartbeat', async () => {
    const app = makeApp()
    app.get('/heartbeat', c =>
      sse(c, async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
      }, {
        heartbeat: {
          intervalMs: 5,
          event: 'heartbeat',
          data: 'still-alive',
        },
      }))

    const res = await app.request('http://localhost/heartbeat')

    expect(res.status).toBe(200)

    const text = await res.text()
    expect(text).toContain('event: heartbeat')
    expect(text).toContain('data: still-alive')
  })

  it('lets callers override the default cache header when needed', async () => {
    const app = makeApp()
    app.get('/custom-cache', c =>
      sse(c, async (send) => {
        await send('ok')
      }, {
        headers: { 'Cache-Control': 'private, max-age=0' },
      }))

    const res = await app.request('http://localhost/custom-cache')

    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, max-age=0')
    expect(res.headers.get('x-accel-buffering')).toBe('no')
  })
})
