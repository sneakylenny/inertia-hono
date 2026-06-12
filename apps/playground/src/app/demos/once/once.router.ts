import { Hono } from 'hono'
import { once, render, type InertiaVariables } from '@sneakylenny/inertia-hono'

/**
 * Shared counter — increments only when the server actually executes a
 * once() callback. Both pages share it so you can see that navigating
 * between Page A and Page B doesn't trigger an extra resolver run.
 */
let configRuns = 0

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/once-demo', c =>
  render(c, 'OnceDemoA', {
    config: once(() => {
      configRuns++
      return { runs: configRuns, resolvedOn: 'Page A' }
    }),
  }),
)

app.get('/once-demo/b', c =>
  render(c, 'OnceDemoB', {
    config: once(() => {
      configRuns++
      return { runs: configRuns, resolvedOn: 'Page B' }
    }),
  }),
)

export default app
