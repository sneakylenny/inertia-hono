import type { Context } from 'hono'
import type { CookieOptions } from 'hono/utils/cookie'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'

/** Cookie name used to carry the single-request flash bag between requests. */
export const INERTIA_FLASH_COOKIE = 'inertia.flash'

/**
 * Payload carried in the flash cookie. `errors` is the conventional Inertia errors bag;
 * `flash` holds arbitrary one-shot props (e.g. success toasts) merged into shared data
 * on the next request.
 */
export type InertiaFlashPayload = {
  errors?: Record<string, string>
  flash?: Record<string, unknown>
}

export type InertiaFlashCookieOptions = Pick<
  CookieOptions,
  'path' | 'domain' | 'secure' | 'sameSite' | 'httpOnly' | 'maxAge' | 'partitioned' | 'priority' | 'prefix'
>

const DEFAULT_COOKIE_OPTIONS: InertiaFlashCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'Lax',
  maxAge: 120,
}

function cookieOptionsFor(
  overrides: InertiaFlashCookieOptions | undefined,
): InertiaFlashCookieOptions {
  return { ...DEFAULT_COOKIE_OPTIONS, ...(overrides ?? {}) }
}

/**
 * Sign and set the flash cookie for the next request. Payload is JSON-encoded and
 * HMAC-signed with `secret` via Hono's [`setSignedCookie`](https://hono.dev/docs/helpers/cookie).
 */
export async function writeInertiaFlash(
  c: Context,
  payload: InertiaFlashPayload,
  secret: string,
  cookieOptions?: InertiaFlashCookieOptions,
): Promise<void> {
  await setSignedCookie(
    c,
    INERTIA_FLASH_COOKIE,
    JSON.stringify(payload),
    secret,
    cookieOptionsFor(cookieOptions),
  )
}

/**
 * Read, verify and consume the flash cookie. Returns `null` if there is no cookie,
 * its signature is invalid, or its payload can't be parsed. Always clears the cookie
 * so it's strictly one-shot (matches Laravel's flash-session semantics).
 */
export async function readInertiaFlash(
  c: Context,
  secret: string,
  cookieOptions?: InertiaFlashCookieOptions,
): Promise<InertiaFlashPayload | null> {
  const raw = await getSignedCookie(c, secret, INERTIA_FLASH_COOKIE)
  if (raw === undefined) return null

  const clearOptions = cookieOptionsFor(cookieOptions)
  deleteCookie(c, INERTIA_FLASH_COOKIE, {
    path: clearOptions.path,
    domain: clearOptions.domain,
    secure: clearOptions.secure,
  })

  if (raw === false) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as InertiaFlashPayload
  }
  catch {
    return null
  }
}

/** True when there is at least one field-level error or flash entry to persist. */
export function hasFlashContent(payload: InertiaFlashPayload): boolean {
  const hasErrors = !!payload.errors && Object.keys(payload.errors).length > 0
  const hasFlash = !!payload.flash && Object.keys(payload.flash).length > 0
  return hasErrors || hasFlash
}
