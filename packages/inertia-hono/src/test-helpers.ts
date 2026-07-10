import { Hono } from 'hono'
import { createInertia, type InertiaVariables } from './index.js'

export const TEST_FLASH_SECRET = 'test-secret'

export function makeApp(opts?: Parameters<typeof createInertia>[0]) {
  const { middleware } = createInertia({
    version: 'v1',
    flashSecret: TEST_FLASH_SECRET,
    ...opts,
  })
  const app = new Hono<{ Variables: InertiaVariables }>()
  app.use(middleware)
  return app
}

/**
 * Extract the first `Set-Cookie` value that starts with a given cookie name.
 * Hono's `Set-Cookie` is typically a single header; split on ", " as a safety net
 * if the adapter combines them.
 */
export function getSetCookie(res: Response, name: string): string | null {
  const raw = res.headers.get('set-cookie')
  if (!raw) return null
  for (const entry of raw.split(/,\s(?=[^,;]+=)/)) {
    if (entry.trim().startsWith(`${name}=`)) return entry.trim()
  }
  return null
}
