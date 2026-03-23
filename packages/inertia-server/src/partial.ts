import { parseCommaList, readHeader } from './headers.js'
import type { InertiaRequestLike } from './types.js'

/**
 * Apply [partial reload](https://inertiajs.com/docs/v3/core-concepts/the-protocol#partial-reloads) prop filtering.
 * `errors` is always kept. If both Partial-Data and Partial-Except are sent, Except wins.
 */
export function filterPartialProps(
  req: InertiaRequestLike,
  component: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const partialComponent = readHeader(req.headers, 'x-inertia-partial-component')
  if (!partialComponent || partialComponent !== component) {
    return props
  }

  const partialExceptRaw = readHeader(req.headers, 'x-inertia-partial-except')
  const partialDataRaw = readHeader(req.headers, 'x-inertia-partial-data')
  const errors = props.errors ?? {}

  if (partialExceptRaw !== undefined && partialExceptRaw !== '') {
    const exclude = new Set(parseCommaList(partialExceptRaw))
    const out: Record<string, unknown> = { errors }
    for (const [key, value] of Object.entries(props)) {
      if (key === 'errors') continue
      if (!exclude.has(key)) out[key] = value
    }
    return out
  }

  if (partialDataRaw !== undefined && partialDataRaw !== '') {
    const include = new Set(parseCommaList(partialDataRaw))
    const out: Record<string, unknown> = { errors }
    for (const key of include) {
      if (key === 'errors') continue
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        out[key] = props[key]
      }
    }
    return out
  }

  return props
}
