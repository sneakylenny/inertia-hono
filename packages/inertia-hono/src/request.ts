import type { Context } from 'hono'

export function pathWithSearch(c: Context): string {
  const raw = c.req.url
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const u = new URL(raw)
    return u.pathname + u.search
  }
  return raw.startsWith('/') ? raw : `/${raw}`
}

/** Full URL for `X-Inertia-Location` per protocol when possible. */
export function inertiaLocationUrl(c: Context): string {
  const raw = c.req.url
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }
  const path = pathWithSearch(c)
  const host = c.req.header('host') ?? 'localhost'
  const proto = c.req.header('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}${path}`
}

export function toInertiaRequest(c: Context) {
  return {
    method: c.req.method,
    url: pathWithSearch(c),
    headers: c.req.raw.headers,
  }
}
