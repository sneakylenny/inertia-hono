import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { RedirectStatusCode } from 'hono/utils/http-status'
import {
  isInertiaRequest,
  resolveInertia,
  type ResolveInertiaInput,
} from 'inertia-server'

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
  share: (props: Record<string, unknown>) => void
  render: (
    component: string,
    props?: Record<string, unknown>,
  ) => Promise<Response>
}

export type InertiaVariables = {
  inertia: InertiaInstance
  /** Populated by `share()` / `inertia.share()`; merged into page props on `render`. */
  inertiaShared?: Record<string, unknown>
}

/**
 * Render an Inertia page. Same contract as `share(c, props)` — `c` first, then payload.
 * Delegates to `c.var.inertia` (requires Inertia middleware on the route).
 */
export function render(
  c: Context<{ Variables: InertiaVariables }>,
  component: string,
  props?: Record<string, unknown>,
): Promise<Response> {
  return c.var.inertia.render(component, props)
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

/**
 * [External / full-page redirect](https://inertiajs.com/redirects#external-redirects):
 * Inertia XHR requests receive `409` + `X-Inertia-Location` so the client performs a
 * full navigation (`window.location`); other requests get a normal HTTP redirect
 * (same idea as Laravel `Inertia::location()` + `Redirect::away()` for non-Inertia).
 */
export function location(
  c: Context,
  url: string | URL,
  redirectStatus: RedirectStatusCode = 302,
): Response {
  const href = typeof url === 'string' ? url : url.href
  if (isInertiaRequest(toInertiaRequest(c))) {
    return new Response(null, {
      status: 409,
      headers: { 'X-Inertia-Location': href },
    })
  }
  return c.redirect(href, redirectStatus)
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
} {
  async function renderForContext(
    c: Context,
    component: string,
    props: Record<string, unknown> = {},
  ): Promise<Response> {
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
  }

  const middleware = createMiddleware(async (c, next) => {
    const inertia: InertiaInstance = {
      share: props => mergeInertiaShared(c, props),
      render: (component, props) =>
        renderForContext(c, component, props ?? {}),
    }
    c.set('inertia', inertia)
    await next()
  })

  return { middleware }
}

export {
  defer,
  isInertiaDeferProp,
  isInertiaDeferred,
  isInertiaRequest,
  partial,
  resolveInertia,
  type InertiaDeferProp,
  type InertiaDeferredProp,
  type InertiaPage,
  type InertiaRequestLike,
  type ResolveInertiaInput,
  type ResolveInertiaResult,
} from 'inertia-server'

export {
  createViteHtmlRenderer,
  readViteManifest,
  VITE_MANIFEST_PATH,
  type ViteHtmlRenderer,
  type ViteHtmlRendererOptions,
  type ViteManifest,
  type ViteManifestEntry,
} from './vite.js'
