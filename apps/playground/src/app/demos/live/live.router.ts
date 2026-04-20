import { Hono } from 'hono'
import { render, sse, type InertiaVariables } from 'inertia-hono'
import {
  listPressEvents,
  recordButtonPress,
  subscribePressEvents,
} from './live.store.js'

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/live-events', c =>
  render(c, 'LiveEvents', { initialEvents: listPressEvents() }),
)

app.get('/api/live-events/stream', c =>
  sse(c, async (send, stream) => {
    await send({ connected: true, events: listPressEvents() }, { event: 'ready' })

    // For testing purposes, else the connection will stay open indefinitely. In a real app, you likely wouldn't want this.
    if (c.req.query('once') === '1') return

    const unsubscribe = subscribePressEvents((entry) => {
      void send(entry, { event: 'pressed' }).catch(() => undefined)
    })

    try {
      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve())
      })
    }
    finally {
      unsubscribe()
    }
  }, {
    heartbeat: {
      intervalMs: 5000,
    },
  }),
)

app.post('/api/live-events/press', (c) => {
  const entry = recordButtonPress()
  return c.json({ ok: true as const, entry })
})

export default app
