import { isInertiaRequest, readHeader } from './headers.js'
import type { InertiaRequestLike } from './types.js'

/**
 * [Asset versioning](https://inertiajs.com/docs/v3/core-concepts/the-protocol#asset-versioning):
 * 409 + X-Inertia-Location on Inertia GET when client version differs.
 */
export function getVersionMismatch(
  req: InertiaRequestLike,
  serverVersion: string | number,
  locationUrl: string,
): { mismatch: true; location: string } | { mismatch: false } {
  if (!isInertiaRequest(req)) return { mismatch: false }
  if (req.method.toUpperCase() !== 'GET') return { mismatch: false }

  const client = readHeader(req.headers, 'x-inertia-version')
  if (client === undefined || client === '') return { mismatch: false }

  const sv = String(serverVersion)
  if (client === sv) return { mismatch: false }

  return { mismatch: true, location: locationUrl }
}
