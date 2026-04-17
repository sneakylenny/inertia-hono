import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import {
  back,
  createInertia,
  INERTIA_FLASH_COOKIE,
  render,
  type InertiaVariables,
} from './index.js'

const SECRET = 'test-flash-secret'

function makeApp(opts?: Parameters<typeof createInertia>[0]) {
  const { middleware } = createInertia({
    version: 'v1',
    flashSecret: SECRET,
    ...opts,
  })
  const app = new Hono<{ Variables: InertiaVariables }>()
  app.use(middleware)
  return app
}

/**
 * Extract the first `Set-Cookie` value that starts with a given cookie name.
 * Hono's `Set-Cookie` is typically a single header; split on ", " as a safety net
 * if the adapter combines them.
 */
function getSetCookie(res: Response, name: string): string | null {
  const raw = res.headers.get('set-cookie')
  if (!raw) return null
  for (const entry of raw.split(/,\s(?=[^,;]+=)/)) {
    if (entry.trim().startsWith(`${name}=`)) return entry.trim()
  }
  return null
}

describe('back()', () => {
  it('redirects 303 to the same-origin Referer', async () => {
    const app = makeApp()
    app.post('/submit', c => back(c))

    const res = await app.request('http://localhost/submit', {
      method: 'POST',
      headers: { referer: 'http://localhost/form' },
    })

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('http://localhost/form')
  })

  it('falls back to "/" when Referer is missing', async () => {
    const app = makeApp()
    app.post('/submit', c => back(c))

    const res = await app.request('http://localhost/submit', { method: 'POST' })

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/')
  })

  it('falls back when Referer is cross-origin (no open redirect)', async () => {
    const app = makeApp()
    app.post('/submit', c => back(c, undefined, { fallback: '/safe' }))

    const res = await app.request('http://localhost/submit', {
      method: 'POST',
      headers: { referer: 'https://evil.example.com/phish' },
    })

    expect(res.headers.get('location')).toBe('/safe')
  })

  it('honors a custom status code', async () => {
    const app = makeApp()
    app.post('/submit', c => back(c, undefined, { status: 302 }))

    const res = await app.request('http://localhost/submit', {
      method: 'POST',
      headers: { referer: 'http://localhost/form' },
    })

    expect(res.status).toBe(302)
  })

  it('round-trips errors via the signed flash cookie into the next request', async () => {
    const app = makeApp()
    app.get('/form', c => render(c, 'Form'))
    app.post('/form', c => back(c, { errors: { email: 'Email is required' } }))

    const postRes = await app.request('http://localhost/form', {
      method: 'POST',
      headers: { referer: 'http://localhost/form' },
    })
    expect(postRes.status).toBe(303)

    const setCookie = getSetCookie(postRes, INERTIA_FLASH_COOKIE)
    expect(setCookie, 'flash cookie should be set').toBeTruthy()

    const [cookiePair] = setCookie!.split(';')
    const getRes = await app.request('http://localhost/form', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'v1',
        'cookie': cookiePair!,
      },
    })

    expect(getRes.status).toBe(200)
    const body = (await getRes.json()) as {
      props: { errors: Record<string, string> }
    }
    expect(body.props.errors).toEqual({ email: 'Email is required' })

    const clearCookie = getSetCookie(getRes, INERTIA_FLASH_COOKIE)
    expect(clearCookie, 'flash cookie should be cleared after read').toBeTruthy()
    expect(clearCookie!).toMatch(/Max-Age=0|expires=Thu, 01 Jan 1970/i)
  })

  it('also surfaces `flash` messages on the next request', async () => {
    const app = makeApp()
    app.get('/', c => render(c, 'Home'))
    app.post('/save', c => back(c, { flash: { success: 'Saved!' } }))

    const postRes = await app.request('http://localhost/save', {
      method: 'POST',
      headers: { referer: 'http://localhost/' },
    })
    const cookie = getSetCookie(postRes, INERTIA_FLASH_COOKIE)!.split(';')[0]!

    const getRes = await app.request('http://localhost/', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'v1',
        'cookie': cookie,
      },
    })
    const body = (await getRes.json()) as {
      props: { flash?: Record<string, unknown> }
    }
    expect(body.props.flash).toEqual({ success: 'Saved!' })
  })

  it('ignores a flash cookie with a tampered signature', async () => {
    const app = makeApp()
    app.get('/', c => render(c, 'Home'))

    const res = await app.request('http://localhost/', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'v1',
        'cookie': `${INERTIA_FLASH_COOKIE}=${encodeURIComponent(
          JSON.stringify({ errors: { email: 'x' } }),
        )}.not-a-valid-signature`,
      },
    })

    const body = (await res.json()) as { props: { errors: unknown } }
    expect(body.props.errors).toEqual({})
  })

  it('throws a clear error if no flashSecret is configured', async () => {
    const { middleware } = createInertia({ version: 'v1' })
    const app = new Hono<{ Variables: InertiaVariables }>()
    app.use(middleware)
    app.post('/submit', c => back(c, { errors: { email: 'required' } }))
    app.onError((err, c) => c.json({ message: err.message }, 500))

    const res = await app.request('http://localhost/submit', {
      method: 'POST',
      headers: { referer: 'http://localhost/' },
    })
    expect(res.status).toBe(500)
    const body = (await res.json()) as { message: string }
    expect(body.message).toMatch(/flashSecret/)
  })

  it('does not set a cookie when the payload has no content', async () => {
    const app = makeApp()
    app.post('/submit', c => back(c, { errors: {}, flash: {} }))

    const res = await app.request('http://localhost/submit', {
      method: 'POST',
      headers: { referer: 'http://localhost/form' },
    })

    expect(res.status).toBe(303)
    expect(getSetCookie(res, INERTIA_FLASH_COOKIE)).toBeNull()
  })
})
