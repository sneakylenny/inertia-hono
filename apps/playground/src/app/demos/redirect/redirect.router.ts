import { Hono } from 'hono'
import { location, render, type InertiaVariables } from '@sneakylenny/inertia-hono'

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/redirect-demo', (c) => {
  return render(c, 'Redirect')
})

app.get('/redirect-internal-test', (c) => {
  return c.redirect('/about', 302)
})

app.get('/redirect-external-test', (c) => {
  return location(c, 'https://www.duckduckgo.com')
})

export default app
