import { Hono } from 'hono'
import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import {
  createInertia,
  INERTIA_FLASH_COOKIE,
  render,
  type InertiaVariables,
} from './index.js'
import { inertiaValidator } from './validator.js'

const SECRET = 'test-validator-secret'

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

function getSetCookie(res: Response, name: string): string | null {
  const raw = res.headers.get('set-cookie')
  if (!raw) return null
  for (const entry of raw.split(/,\s(?=[^,;]+=)/)) {
    if (entry.trim().startsWith(`${name}=`)) return entry.trim()
  }
  return null
}

const todoSchema = v.object({
  text: v.pipe(v.string('Text is required.'), v.minLength(1, 'Text is required.')),
})

describe('inertiaValidator', () => {
  it('passes through to the handler when validation succeeds', async () => {
    const app = makeApp()
    app.post('/todos', inertiaValidator('json', todoSchema), (c) => {
      const { text } = c.req.valid('json')
      return c.json({ text })
    })

    const res = await app.request('http://localhost/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'ship it' }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ text: 'ship it' })
  })

  it('redirects back with flashed errors when validation fails', async () => {
    const app = makeApp()
    app.get('/todos', c => render(c, 'Todos'))
    app.post('/todos', inertiaValidator('json', todoSchema), c =>
      c.json({ never: true }))

    const res = await app.request('http://localhost/todos', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'referer': 'http://localhost/todos',
      },
      body: JSON.stringify({ text: '' }),
    })

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('http://localhost/todos')

    const setCookie = getSetCookie(res, INERTIA_FLASH_COOKIE)
    expect(setCookie, 'flash cookie should be set').toBeTruthy()

    const [cookiePair] = setCookie!.split(';')
    const follow = await app.request('http://localhost/todos', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'v1',
        'cookie': cookiePair!,
      },
    })

    expect(follow.status).toBe(200)
    const body = (await follow.json()) as {
      props: { errors: Record<string, string> }
    }
    expect(body.props.errors).toEqual({ text: 'Text is required.' })
  })

  it('forwards `options.errors` to toInertiaErrors (e.g. fallbackKey)', async () => {
    const pathlessSchema = v.pipe(
      v.unknown(),
      v.check(() => false, 'No good.'),
    )
    const app = makeApp()
    app.get('/form', c => render(c, 'Form'))
    app.post(
      '/form',
      inertiaValidator('json', pathlessSchema, {
        errors: { fallbackKey: 'form' },
      }),
      c => c.json({ never: true }),
    )

    const postRes = await app.request('http://localhost/form', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'referer': 'http://localhost/form',
      },
      body: JSON.stringify({ anything: 1 }),
    })
    const cookie = getSetCookie(postRes, INERTIA_FLASH_COOKIE)!.split(';')[0]!

    const getRes = await app.request('http://localhost/form', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': 'v1',
        'cookie': cookie,
      },
    })

    const body = (await getRes.json()) as {
      props: { errors: Record<string, string> }
    }
    expect(body.props.errors).toEqual({ form: 'No good.' })
  })

  it('forwards `options.back` to back() (e.g. custom fallback)', async () => {
    const app = makeApp()
    app.post(
      '/todos',
      inertiaValidator('json', todoSchema, {
        back: { fallback: '/todos/new', status: 302 },
      }),
      c => c.json({ never: true }),
    )

    const res = await app.request('http://localhost/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/todos/new')
  })

  it('does not short-circuit when validation succeeds (handler still runs)', async () => {
    const app = makeApp()
    let handlerCalled = false
    app.post('/todos', inertiaValidator('json', todoSchema), (c) => {
      handlerCalled = true
      return c.text('ok')
    })

    await app.request('http://localhost/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'a' }),
    })

    expect(handlerCalled).toBe(true)
  })
})
