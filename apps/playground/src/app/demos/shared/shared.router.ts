import { Hono } from 'hono'
import { render, share, type InertiaVariables } from '@sneakylenny/inertia-hono'
import { sharedDemoShareMiddleware } from './shared.middleware.js'

const app = new Hono<{ Variables: InertiaVariables }>()

app.use('/shared-demo', sharedDemoShareMiddleware)

app.get('/shared-demo', (c) => {
  share(c, {
    sharedViaRouteHandler:
      'Set with share(c) in the GET handler (merged after middleware share data).',
  })
  return render(c, 'SharedDemo', {
    fromRender:
      'Passed as the third argument to render(); wins over shared keys with the same name.',
  })
})

export default app
