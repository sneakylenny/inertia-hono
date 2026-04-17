import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { RedirectStatusCode } from 'hono/utils/http-status'
import {
  isInertiaRequest,
  resolveInertia,
  type ResolveInertiaInput,
} from 'inertia-server'
import {
  hasFlashContent,
  readInertiaFlash,
  writeInertiaFlash,
  type InertiaFlashCookieOptions,
  type InertiaFlashPayload,
} from './flash.js'

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
  /**
   * Secret used to sign the one-shot flash cookie that powers {@link back}.
   * Omit to disable flash support (`inertia.flash` / `back()` will throw if called).
   * @see https://inertiajs.com/redirects
   */
  flashSecret?: string
  /** Override cookie attributes used for the flash cookie (path, sameSite, secure, …). */
  flashCookie?: InertiaFlashCookieOptions
}

export type InertiaInstance = {
  /** Merge props into this request’s shared Inertia payload (same merge order as `share()`). */
  share: (props: Record<string, unknown>) => void
  render: (
    component: string,
    props?: Record<string, unknown>,
  ) => Promise<Response>
  /**
   * Flash a one-shot payload (typically `{ errors }`) into a signed cookie so it
   * surfaces as shared props on the next request. Requires `createInertia({ flashSecret })`.
   */
  flash: (payload: InertiaFlashPayload) => Promise<void>
}

export type InertiaVariables = {
  inertia: InertiaInstance
  /** Populated by `share()` / `inertia.share()`; merged into page props on `render`. */
  inertiaShared?: Record<string, unknown>
}

/**
 * Render an Inertia page. Same contract as `share(c, props)` — `c` first, then payload.
 * Delegates to `c.var.inertia` (requires Inertia middleware on the route).
 *
 * Accepts any Hono `Context` so it can be called from validator hooks and generic
 * middleware without casting. Users can still opt into fully-typed variables by
 * declaring `Hono<{ Variables: InertiaVariables }>` or augmenting Hono's
 * `ContextVariableMap`.
 */
export function render(
  c: Context,
  component: string,
  props?: Record<string, unknown>,
): Promise<Response> {
  return getInertia(c).render(component, props)
}

function getInertia(c: Context): InertiaInstance {
  const inertia = (c.var as { inertia?: InertiaInstance }).inertia
  if (!inertia) {
    throw new Error(
      'inertia-hono: no inertia instance on this request. '
      + 'Did you forget to register `createInertia().middleware` before the route?',
    )
  }
  return inertia
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

export type BackOptions = {
  /** Redirect status code. Defaults to `303` per the Inertia protocol. */
  status?: RedirectStatusCode
  /** URL used when `Referer` is missing or cross-origin. Defaults to `'/'`. */
  fallback?: string
}

/**
 * [Redirect back](https://inertiajs.com/redirects) to the `Referer` with an optional
 * flashed payload (`errors`, `flash`) carried in a signed cookie. The next request's
 * middleware surfaces the payload as shared props, so any page you land on already has
 * `errors` and `flash` available — no need to re-render the current view by hand.
 *
 * Uses status `303 See Other` by default so browsers and the Inertia client follow the
 * redirect with a `GET`, completing the Post/Redirect/Get pattern. Falls back to
 * `options.fallback` (default `'/'`) when `Referer` is missing or points to a different
 * origin.
 */
export async function back(
  c: Context,
  payload?: InertiaFlashPayload,
  options: BackOptions = {},
): Promise<Response> {
  if (payload && hasFlashContent(payload)) {
    await getInertia(c).flash(payload)
  }
  const { status = 303, fallback = '/' } = options
  const target = sameOriginReferer(c) ?? fallback
  return c.redirect(target, status)
}

function sameOriginReferer(c: Context): string | null {
  const referer = c.req.header('referer')
  if (!referer) return null
  try {
    const refUrl = new URL(referer)
    const reqUrl = new URL(c.req.url)
    return refUrl.origin === reqUrl.origin ? referer : null
  }
  catch {
    return null
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
    return c.body(null, 409, { 'X-Inertia-Location': href })
  }
  return c.redirect(href, redirectStatus)
}

function inertiaResponse(
  c: Context,
  result: Awaited<ReturnType<typeof resolveInertia>>,
): Response {
  if (result.kind === 'version-mismatch') {
    return c.body(null, result.status, result.headers)
  }
  const body
    = typeof result.body === 'string'
      ? result.body
      : JSON.stringify(result.body)
  return c.body(body, result.status, result.headers)
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
      errors: {},
      ...fromOptions,
      ...fromCalls,
      ...props,
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

    return inertiaResponse(c, result)
  }

  const { flashSecret, flashCookie } = options

  const middleware = createMiddleware(async (c, next) => {
    if (flashSecret) {
      const incoming = await readInertiaFlash(c, flashSecret, flashCookie)
      if (incoming) {
        if (incoming.errors && Object.keys(incoming.errors).length > 0) {
          mergeInertiaShared(c, { errors: incoming.errors })
        }
        if (incoming.flash && Object.keys(incoming.flash).length > 0) {
          mergeInertiaShared(c, { flash: incoming.flash })
        }
      }
    }

    const inertia: InertiaInstance = {
      share: props => mergeInertiaShared(c, props),
      render: (component, props) =>
        renderForContext(c, component, props ?? {}),
      flash: async (payload) => {
        if (!flashSecret) {
          throw new Error(
            'inertia-hono: flash requires `createInertia({ flashSecret })`. '
            + 'Provide a secret to enable `back()` and `inertia.flash`.',
          )
        }
        await writeInertiaFlash(c, payload, flashSecret, flashCookie)
      },
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
  issueDotPath,
  partial,
  resolveInertia,
  toInertiaErrors,
  type InertiaDeferProp,
  type InertiaDeferredProp,
  type InertiaErrors,
  type InertiaPage,
  type InertiaRequestLike,
  type ResolveInertiaInput,
  type ResolveInertiaResult,
  type ToInertiaErrorsOptions,
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

export {
  INERTIA_FLASH_COOKIE,
  readInertiaFlash,
  writeInertiaFlash,
  type InertiaFlashCookieOptions,
  type InertiaFlashPayload,
} from './flash.js'
