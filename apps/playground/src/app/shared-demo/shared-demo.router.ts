import { Hono } from 'hono'
import { share, type InertiaVariables } from 'inertia-hono'
import { sharedDemoShareMiddleware } from './shared-demo.middleware.js'

const app = new Hono<{ Variables: InertiaVariables }>()

app.use('/shared-demo', sharedDemoShareMiddleware)

app.get('/shared-demo', (c) => {
  share(c, {
    sharedViaRouteHandler:
      'Set with share(c) in the GET handler (merged after middleware share data).',
  })
  return c.var.inertia.render(c, 'SharedDemo', {
    fromRender:
      'Passed as the third argument to render(); wins over shared keys with the same name.',
  })
})

export default app
