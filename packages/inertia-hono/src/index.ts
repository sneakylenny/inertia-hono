import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { resolveInertia, type ResolveInertiaInput } from 'inertia-server'

export type InertiaVersion = string | number | (() => string | number)

export type CreateInertiaOptions = {
  version: InertiaVersion
  share?: (
    c: Context,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>
  rootElementId?: string
  pageScriptDataAttribute?: string
  encryptHistory?: boolean
  clearHistory?: boolean
  preserveFragment?: boolean
  renderHtml?: ResolveInertiaInput['renderHtml']
}

export type InertiaInstance = {
  /** Merge props into this request’s shared Inertia payload (same merge order as `share()`). */
  share: (c: Context, props: Record<string, unknown>) => void
  render: (
    c: Context,
    component: string,
    props?: Record<string, unknown>,
  ) => Promise<Response>
}

export type InertiaVariables = {
  inertia: InertiaInstance
  /** Populated by `share()` / `inertia.share()`; merged into page props on `render`. */
  inertiaShared?: Record<string, unknown>
}

function mergeInertiaShared(c: Context, props: Record<string, unknown>): void {
  const bag
    = c.var.inertiaShared
      ?? (() => {
        const b: Record<string, unknown> = {}
        c.set('inertiaShared', b)
        return b
      })()
  Object.assign(bag, props)
}

/**
 * Merge props into the current request’s shared Inertia payload. Call from any
 * middleware or handler before `render` (works even if registered before the
 * Inertia middleware — the bag is created on first use).
 */
export function share(c: Context, props: Record<string, unknown>): void {
  mergeInertiaShared(c, props)
}

function resolveVersion(v: InertiaVersion): string | number {
  return typeof v === 'function' ? v() : v
}

function pathWithSearch(c: Context): string {
  const raw = c.req.url
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const u = new URL(raw)
    return u.pathname + u.search
  }
  return raw.startsWith('/') ? raw : `/${raw}`
}

/** Full URL for `X-Inertia-Location` per protocol when possible. */
function inertiaLocationUrl(c: Context): string {
  const raw = c.req.url
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }
  const path = pathWithSearch(c)
  const host = c.req.header('host') ?? 'localhost'
  const proto = c.req.header('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}${path}`
}

function toInertiaRequest(c: Context) {
  return {
    method: c.req.method,
    url: pathWithSearch(c),
    headers: c.req.raw.headers,
  }
}

function inertiaResponse(result: Awaited<ReturnType<typeof resolveInertia>>): Response {
  if (result.kind === 'version-mismatch') {
    return new Response(null, {
      status: result.status,
      headers: result.headers,
    })
  }

  if (typeof result.body === 'string') {
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    })
  }

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: result.headers,
  })
}

/**
 * Create Inertia middleware and a `render` helper for Hono.
 * @see https://inertiajs.com/docs/v3/core-concepts/the-protocol
 */
export function createInertia(options: CreateInertiaOptions): {
  middleware: MiddlewareHandler
  /** Same instance stored on `c.var.inertia` after `middleware` runs. */
  instance: InertiaInstance
} {
  const inertia: InertiaInstance = {
    share(c, props) {
      mergeInertiaShared(c, props)
    },
    async render(c, component, props = {}) {
      const fromOptions = options.share ? await options.share(c) : {}
      const fromCalls = c.var.inertiaShared ?? {}
      const merged: Record<string, unknown> = {
        ...fromOptions,
        ...fromCalls,
        ...props,
        errors: props.errors ?? {},
      }

      const result = await resolveInertia({
        request: toInertiaRequest(c),
        component,
        props: merged,
        version: resolveVersion(options.version),
        locationUrl: inertiaLocationUrl(c),
        rootElementId: options.rootElementId,
        pageScriptDataAttribute: options.pageScriptDataAttribute,
        encryptHistory: options.encryptHistory,
        clearHistory: options.clearHistory,
        preserveFragment: options.preserveFragment,
        renderHtml: options.renderHtml,
      })

      return inertiaResponse(result)
    },
  }

  const middleware = createMiddleware(async (c, next) => {
    c.set('inertia', inertia)
    await next()
  })

  return { middleware, instance: inertia }
}

export {
  resolveInertia,
  type InertiaPage,
  type InertiaRequestLike,
  type ResolveInertiaInput,
  type ResolveInertiaResult,
} from 'inertia-server'
