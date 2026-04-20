# inertia-hono

[Hono](https://hono.dev/) adapter for [Inertia.js v3](https://inertiajs.com/docs/v3/core-concepts/the-protocol), built on the **`inertia-server`** package (framework-agnostic protocol layer).

## Install

```bash
bun add inertia-hono hono
```

`inertia-server` is installed as a dependency automatically.

## Usage

```ts
import { Hono } from 'hono'
import { createInertia, render, type InertiaVariables } from 'inertia-hono'

const { middleware } = createInertia({
  version: 'your-asset-version',
  share: async () => ({
    /* shared props */
  }),
  // Optional: custom HTML shell for full page loads
  // renderHtml: async ({ pageJson, rootElementId, pageScriptDataAttribute }) => `...`,
})

const app = new Hono<{ Variables: InertiaVariables }>()
app.use(middleware)

app.get('/posts', c => render(c, 'Posts/Index', { posts: [] }))
```

- **`share(c, props)`** and **`render(c, component, props?)`** — same shape: context first, then payload (mirrors Hono patterns).
- **`c.var.inertia.share(props)`** and **`c.var.inertia.render(component, props?)`** — bound to the request; no repeated `c` on the method calls.

- First visit → HTML with embedded page JSON (`<script type="application/json">`).
- Inertia XHR (`X-Inertia: true`) → JSON with `Vary: X-Inertia` and `X-Inertia: true`.
- GET + version mismatch → `409` and `X-Inertia-Location` (full URL when `Host` / `X-Forwarded-Proto` are available).

## SSE

Use `sse(c, handler)` or `c.var.inertia.sse(handler)` for live server-to-client updates.
Non-string payloads are JSON-encoded automatically.

> If you serve the app with Bun, make sure your `Bun.serve()` `idleTimeout` is longer than your SSE heartbeat interval. Bun's default request timeout is often too short for long-lived event streams.

```ts
import { sse } from 'inertia-hono'

app.get('/events', c =>
  sse(
    c,
    async (send) => {
      await send({ type: 'connected', at: Date.now() }, { event: 'status' })
      await send('ready')
    },
    {
      headers: { 'X-Accel-Buffering': 'no' },
    },
  ),
)
```
