import type { Context } from 'hono'
import { Hono } from 'hono'
import { once, partial, render, type InertiaVariables } from '@sneakylenny/inertia-hono'

/**
 * Shared counter — increments only when the server actually executes a
 * once() callback. Both pages share it so you can see that navigating
 * between Page A and Page B doesn't trigger an extra resolver run.
 */
let configRuns = 0

/** Demo-only: mirrors Inertia's once-prop cache headers for the status badge on Page B. */
function isConfigFromCache(c: Context): boolean {
  const cacheKey = 'config'
  const has = (raw: string | undefined) =>
    raw?.split(',').some(key => key.trim() === cacheKey) ?? false

  if (!has(c.req.header('x-inertia-except-once-props'))) return false
  if (has(c.req.header('x-inertia-reset'))) return false
  return true
}

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/once-demo', c =>
  render(c, 'OnceDemoA', {
    config: once(() => {
      configRuns++
      return { runs: configRuns, resolvedOn: 'Page A' }
    }),
    // Illustration only — not required for once() in real apps.
    configFromCache: partial.always(() => isConfigFromCache(c)),
  }),
)

app.get('/once-demo/b', c =>
  render(c, 'OnceDemoB', {
    config: once(() => {
      configRuns++
      return { runs: configRuns, resolvedOn: 'Page B' }
    }),
    configFromCache: partial.always(() => isConfigFromCache(c)),
  }),
)

export default app
