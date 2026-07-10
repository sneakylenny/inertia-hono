import type { InertiaRequestLike } from './types.js'

export const HEADER_INERTIA = 'x-inertia'
export const HEADER_INERTIA_VERSION = 'x-inertia-version'
export const HEADER_INERTIA_LOCATION = 'X-Inertia-Location'
export const HEADER_PARTIAL_COMPONENT = 'x-inertia-partial-component'
export const HEADER_PARTIAL_DATA = 'x-inertia-partial-data'
export const HEADER_PARTIAL_EXCEPT = 'x-inertia-partial-except'
export const HEADER_EXCEPT_ONCE_PROPS = 'x-inertia-except-once-props'
export const HEADER_RESET = 'x-inertia-reset'

export function readHeader(
  headers: InertiaRequestLike['headers'],
  name: string,
): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined
  }
  const target = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && value !== undefined) {
      return value
    }
  }
  return undefined
}

export function isInertiaRequest(req: InertiaRequestLike): boolean {
  return readHeader(req.headers, HEADER_INERTIA) === 'true'
}

/** Split Inertia comma-separated header values (trim, drop empties). */
export function parseCommaList(value: string | undefined): string[] {
  if (value === undefined || value === '') return []
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}
