import { Hono } from 'hono'
import { defer, render, type InertiaVariables } from 'inertia-hono'

/** Count how often each defer callback runs (see Network tab / UI). */
let primaryRuns = 0
let secondaryDataRuns = 0
let secondaryMoreRuns = 0

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/deferred-demo', c =>
  render(c, 'DeferredDemo', {
    intro: 'The server uses `defer()` so the first response stays small. The Vue `<Deferred>` component shows a fallback until Inertia loads each chunk in follow-up visits.',
    primaryData: defer(async () => {
      primaryRuns++
      await delay(250)
      return {
        resolverRuns: primaryRuns,
        title: 'Default group',
        body: 'This prop uses the default defer group. It is fetched in one follow-up request with any other default-group props.',
        items: ['Item A', 'Item B'],
      }
    }),
    secondaryData: defer(async () => {
      secondaryDataRuns++
      await delay(350)
      return {
        resolverRuns: secondaryDataRuns,
        title: '“secondary” group (first prop)',
        body:
          'This prop shares the group name `secondary` with `secondaryMore`. Inertia requests both in a single follow-up visit.',
      }
    }, 'secondary'),
    secondaryMore: defer(async () => {
      secondaryMoreRuns++
      await delay(350)
      return {
        resolverRuns: secondaryMoreRuns,
        title: '“secondary” group (second prop)',
        body:
          'Check Network: one Inertia request loads this and `secondaryData` together—not one request per prop.',
      }
    }, 'secondary'),
  }),
)

export default app
