import type { MiddlewareHandler } from 'hono'
import { share } from '@sneakylenny/inertia-hono'

/** Path-scoped middleware for `/shared-demo` — runs before the route handler. */
export const sharedDemoShareMiddleware: MiddlewareHandler = async (c, next) => {
  share(c, {
    sharedViaMiddleware:
      'Set with share(c) from path-scoped middleware (runs before the route handler).',
  })
  await next()
}
