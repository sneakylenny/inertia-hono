import type { InertiaRequestLike } from './types.js'

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
  return readHeader(req.headers, 'x-inertia') === 'true'
}

/** Split Inertia comma-separated header values (trim, drop empties). */
export function parseCommaList(value: string | undefined): string[] {
  if (value === undefined || value === '') return []
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}
