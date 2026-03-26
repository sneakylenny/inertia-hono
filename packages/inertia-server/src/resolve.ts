import { resolveDeferredProps } from './deferred.js'
import { filterPartialProps } from './partial.js'
import type { InertiaPage, InertiaRequestLike, ResolveInertiaResult } from './types.js'
import { getVersionMismatch } from './version.js'
import { defaultHtmlShell } from './html.js'
import { isInertiaRequest } from './headers.js'

export type ResolveInertiaInput = {
  request: InertiaRequestLike
  component: string
  /**
   * Merged route + shared props; should include `errors` (default `{}`).
   * Use `partial.lazy`, `partial.optional`, and `partial.always` from this package for deferred evaluation
   * after partial-reload filtering.
   */
  props: Record<string, unknown>
  version: string | number
  /** Full URL for `X-Inertia-Location` on version mismatch (e.g. `https://host/path`). */
  locationUrl: string
  rootElementId?: string
  pageScriptDataAttribute?: string
  /** Optional page fields */
  encryptHistory?: boolean
  clearHistory?: boolean
  preserveFragment?: boolean
  /** Custom HTML document for non-Inertia requests; defaults to {@link defaultHtmlShell}. */
  renderHtml?: (ctx: {
    page: InertiaPage
    pageJson: string
    rootElementId: string
    pageScriptDataAttribute: string
  }) => string | Promise<string>
}

function normalizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const errors = props.errors !== undefined ? props.errors : {}
  return { ...props, errors }
}

/**
 * Resolve an Inertia response from a framework-agnostic request + render input.
 * @see https://inertiajs.com/docs/v3/core-concepts/the-protocol
 */
export async function resolveInertia(
  input: ResolveInertiaInput,
): Promise<ResolveInertiaResult> {
  const rootElementId = input.rootElementId ?? 'app'
  const pageScriptDataAttribute = input.pageScriptDataAttribute ?? 'app'
  const version = input.version

  const mismatch = getVersionMismatch(input.request, version, input.locationUrl)
  if (mismatch.mismatch) {
    return {
      kind: 'version-mismatch',
      status: 409,
      headers: { 'X-Inertia-Location': mismatch.location },
    }
  }

  const mergedProps = normalizeProps(input.props)
  const filtered = filterPartialProps(input.request, input.component, mergedProps)
  const props = await resolveDeferredProps(
    input.request,
    input.component,
    mergedProps,
    filtered,
  )

  const page: InertiaPage = {
    component: input.component,
    props,
    url: input.request.url,
    version,
  }
  if (input.encryptHistory === true) page.encryptHistory = true
  if (input.clearHistory === true) page.clearHistory = true
  if (input.preserveFragment === true) page.preserveFragment = true

  if (!isInertiaRequest(input.request)) {
    const pageJson = JSON.stringify(page)
    const body = input.renderHtml
      ? await input.renderHtml({
          page,
          pageJson,
          rootElementId,
          pageScriptDataAttribute,
        })
      : defaultHtmlShell({
          pageJson,
          rootElementId,
          pageScriptDataAttribute,
        })

    return {
      kind: 'success',
      format: 'html',
      status: 200,
      body,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  }

  return {
    kind: 'success',
    format: 'json',
    status: 200,
    body: page,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Vary': 'X-Inertia',
      'X-Inertia': 'true',
    },
  }
}
