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
