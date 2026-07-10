import { parseCommaList, readHeader, HEADER_EXCEPT_ONCE_PROPS, HEADER_RESET } from './headers.js'
import type { InertiaRequestLike } from './types.js'
import { awaitMaybe } from './utils.js'

/** @internal */
export const INERTIA_ONCE = Symbol.for('inertia.once')

/** A single entry in the `onceProps` page response field. */
export type InertiaOncePropEntry = {
  prop: string
  expiresAt?: number
}

type FreshCondition = boolean | (() => boolean | Promise<boolean>) | undefined

/**
 * A prop marked for client-side caching via {@link once}.
 *
 * After the first response, the client caches the value and sends
 * `X-Inertia-Except-Once-Props` on subsequent requests, allowing the
 * server to skip resolving the callback.
 */
export type InertiaOnceProp<T = unknown> = {
  readonly [INERTIA_ONCE]: true
  readonly fn: () => T | Promise<T>
  readonly freshCondition: FreshCondition
  readonly expiry: number | Date | undefined
  readonly asKey: string | undefined
  readonly isOptional: boolean
  /**
   * Force the server to resolve and return a fresh value, bypassing the
   * client cache. Accepts an optional condition (boolean or sync/async fn).
   */
  fresh(condition?: FreshCondition): InertiaOnceProp<T>
  /**
   * Expire the client cache after a number of seconds from now, or at the
   * given absolute {@link Date}.
   */
  until(value: number | Date): InertiaOnceProp<T>
  /**
   * Store the cached value under `key` on the client, enabling cross-page
   * sharing when two pages use different prop names for the same data.
   */
  as(key: string): InertiaOnceProp<T>
  /** Omit this prop on full visits; only resolve it when explicitly requested via a partial reload. */
  optional(): InertiaOnceProp<T>
}

function makeOnceProp<T>(
  fn: () => T | Promise<T>,
  freshCondition: FreshCondition,
  expiry: number | Date | undefined,
  asKey: string | undefined,
  isOptional: boolean,
): InertiaOnceProp<T> {
  return {
    [INERTIA_ONCE]: true,
    fn,
    freshCondition,
    expiry,
    asKey,
    isOptional,
    fresh(condition?: FreshCondition) {
      return makeOnceProp(fn, condition ?? true, expiry, asKey, isOptional)
    },
    until(value: number | Date) {
      return makeOnceProp(fn, freshCondition, value, asKey, isOptional)
    },
    as(key: string) {
      return makeOnceProp(fn, freshCondition, expiry, key, isOptional)
    },
    optional() {
      return makeOnceProp(fn, freshCondition, expiry, asKey, true)
    },
  }
}

/**
 * Mark a prop for client-side caching, matching
 * [Inertia once props](https://inertiajs.com/docs/v3/data-props/once-props).
 *
 * On the first response the value is resolved and sent; on subsequent requests
 * the client skips requesting it (via `X-Inertia-Except-Once-Props`) and the
 * server skips resolving it.
 *
 * Chain `.fresh()`, `.until()`, `.as()`, and `.optional()` to customise behaviour.
 */
export function once<T>(fn: () => T | Promise<T>): InertiaOnceProp<T> {
  return makeOnceProp(fn, undefined, undefined, undefined, false)
}

export function isInertiaOnceProp(value: unknown): value is InertiaOnceProp {
  return (
    typeof value === 'object'
    && value !== null
    && INERTIA_ONCE in value
    && (value as InertiaOnceProp)[INERTIA_ONCE] === true
    && typeof (value as InertiaOnceProp).fn === 'function'
  )
}

async function resolveFreshCondition(cond: FreshCondition): Promise<boolean> {
  if (cond === undefined || cond === false) return false
  if (cond === true) return true
  return await awaitMaybe(cond())
}

function buildEntry(prop: string, until: number | Date | undefined): InertiaOncePropEntry {
  const entry: InertiaOncePropEntry = { prop }
  if (until !== undefined) {
    const expiresAt = typeof until === 'number' ? Date.now() + until * 1000 : until.getTime()
    if (expiresAt > Date.now()) entry.expiresAt = expiresAt
  }
  return entry
}

/**
 * Evaluate once props against the client's cache headers, producing resolved
 * props and the `onceProps` map for the page response.
 *
 * @param isFullVisit - `true` when this is NOT a filtering partial reload
 *   (i.e., no `X-Inertia-Partial-Data`/`X-Inertia-Partial-Except` for this component).
 */
export async function applyOnceProps(
  request: InertiaRequestLike,
  isFullVisit: boolean,
  mergedProps: Record<string, unknown>,
  filtered: Record<string, unknown>,
): Promise<{
  props: Record<string, unknown>
  onceProps: Record<string, InertiaOncePropEntry> | undefined
}> {
  const exceptKeys = new Set(parseCommaList(readHeader(request.headers, HEADER_EXCEPT_ONCE_PROPS)))
  const resetKeys = new Set(parseCommaList(readHeader(request.headers, HEADER_RESET)))
  const working: Record<string, unknown> = { ...filtered }
  const onceProps: Record<string, InertiaOncePropEntry> = {}
  let hasOnceProps = false

  for (const [key, val] of Object.entries(mergedProps)) {
    if (key === 'errors') continue
    if (!isInertiaOnceProp(val)) continue

    const cacheKey = val.asKey ?? key
    const isExcepted = exceptKeys.has(cacheKey)
    const isReset = resetKeys.has(cacheKey)
    const isFresh = await resolveFreshCondition(val.freshCondition)
    const inFiltered = Object.prototype.hasOwnProperty.call(filtered, key)

    // Optional once props are omitted on full visits unless reset/fresh forces them.
    if (val.isOptional && isFullVisit && !isReset && !isFresh) {
      delete working[key]
      if (isExcepted) {
        onceProps[cacheKey] = buildEntry(key, val.expiry)
        hasOnceProps = true
      }
      continue
    }

    // Partial reload that didn't target this prop: don't compute, but keep the
    // cache entry alive when the client still holds it.
    if (!inFiltered) {
      if (isExcepted) {
        onceProps[cacheKey] = buildEntry(key, val.expiry)
        hasOnceProps = true
      }
      continue
    }

    const skipCompute = isExcepted && !isReset && !isFresh
    if (skipCompute) {
      delete working[key]
    }
    else {
      working[key] = await awaitMaybe(val.fn())
    }
    onceProps[cacheKey] = buildEntry(key, val.expiry)
    hasOnceProps = true
  }

  return {
    props: working,
    onceProps: hasOnceProps ? onceProps : undefined,
  }
}
