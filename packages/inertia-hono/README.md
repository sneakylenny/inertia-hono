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
import { createInertia, type InertiaVariables } from 'inertia-hono'

const { middleware, instance } = createInertia({
  version: 'your-asset-version',
  share: async () => ({ /* shared props */ }),
  // Optional: custom HTML shell for full page loads
  // renderHtml: async ({ pageJson, rootElementId, pageScriptDataAttribute }) => `...`,
})

const app = new Hono<{ Variables: InertiaVariables }>()
app.use(middleware)

app.get('/posts', (c) =>
  instance.render(c, 'Posts/Index', { posts: [] }),
)
```

- First visit → HTML with embedded page JSON (`<script type="application/json">`).
- Inertia XHR (`X-Inertia: true`) → JSON with `Vary: X-Inertia` and `X-Inertia: true`.
- GET + version mismatch → `409` and `X-Inertia-Location` (full URL when `Host` / `X-Forwarded-Proto` are available).
