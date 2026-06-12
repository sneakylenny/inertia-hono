import type { InertiaOncePropEntry } from './once.js'
import type { InertiaScrollPropMeta } from './scroll.js'

/** Minimal request shape adapters map from any HTTP stack. */
export type InertiaRequestLike = {
  method: string
  /** Path including query string, e.g. `/events/80` or `/posts?page=1` */
  url: string
  headers: Headers | Record<string, string | undefined>
}

/** Inertia [page object](https://inertiajs.com/docs/v3/core-concepts/the-protocol#the-page-object) (subset for this library). */
export type InertiaPage = {
  component: string
  props: Record<string, unknown>
  url: string
  version: string | number
  encryptHistory?: boolean
  clearHistory?: boolean
  preserveFragment?: boolean
  /**
   * Pending [deferred props](https://inertiajs.com/docs/v3/data-props/deferred-props) by group name.
   * Omitted when there are no deferred props left to load.
   */
  deferredProps?: Record<string, string[]>
  /**
   * Snapshot of which props were deferred on first paint; used by the client across follow-up requests.
   * Optional — the client copies from `deferredProps` on the first response when unset.
   */
  initialDeferredProps?: Record<string, string[]>
  /**
   * [Once props](https://inertiajs.com/docs/v3/data-props/once-props) cached by the client,
   * keyed by cache key. The client refills omitted values from its cache and resends
   * `X-Inertia-Except-Once-Props` for entries it still holds. Omitted when there are none.
   */
  onceProps?: Record<string, InertiaOncePropEntry>
  /**
   * Prop paths whose array values the client appends to (and objects shallow-merges into)
   * the existing prop instead of replacing it. See [merge props](https://inertiajs.com/docs/v3/data-props/merging-props).
   * Only applied on partial reloads; omitted when empty.
   */
  mergeProps?: string[]
  /** Like {@link mergeProps} but array values are prepended. Omitted when empty. */
  prependProps?: string[]
  /** Prop paths merged recursively through nested objects/arrays. Omitted when empty. */
  deepMergeProps?: string[]
  /**
   * Dot-paths (e.g. `posts.id`) telling the client to match existing array items by that
   * field and update them in place instead of appending duplicates. Omitted when empty.
   */
  matchPropsOn?: string[]
  /**
   * [Infinite scroll](https://inertiajs.com/docs/v3/data-props/infinite-scroll) pagination
   * metadata keyed by prop name. The client reads it to know which page to load next and
   * whether to reset accumulated data. Omitted when there are none.
   */
  scrollProps?: Record<string, InertiaScrollPropMeta>
}

export type InertiaJsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8'
  'Vary': 'X-Inertia'
  'X-Inertia': 'true'
}

export type InertiaHtmlHeaders = {
  'Content-Type': 'text/html; charset=utf-8'
}

export type InertiaVersionMismatchResult = {
  kind: 'version-mismatch'
  status: 409
  headers: {
    'X-Inertia-Location': string
  }
}

export type InertiaSuccessResult
  = | {
    kind: 'success'
    /** Discriminates HTML vs JSON success so `headers` narrows with `body`. */
    format: 'html'
    status: 200
    /** Full HTML document for first (non-XHR) visits */
    body: string
    headers: InertiaHtmlHeaders
  }
  | {
    kind: 'success'
    format: 'json'
    status: 200
    /** JSON page object for Inertia visits */
    body: InertiaPage
    headers: InertiaJsonHeaders
  }

export type ResolveInertiaResult = InertiaVersionMismatchResult | InertiaSuccessResult
