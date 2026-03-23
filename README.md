# Inertia + Hono monorepo

[Bun](https://bun.sh/) workspaces + [moon](https://moonrepo.dev/) + two publishable packages:

| Package | Description |
| --------|-------------|
| [`inertia-server`](packages/inertia-server/) | Framework-agnostic [Inertia v3 protocol](https://inertiajs.com/docs/v3/core-concepts/the-protocol) (headers, partial reloads, asset version 409, HTML vs JSON). |
| [`inertia-hono`](packages/inertia-hono/) | Thin Hono adapter that maps `Context` → `inertia-server` and returns `Response`. |
| [`apps/playground`](apps/playground/) | Hono + **Vue 3** + `@inertiajs/vue3` + Vite: full-page HTML from the adapter, client modules from Vite (`bun run dev` runs both). Vitest covers the Vue page and a small Hono/Inertia integration spec. |

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- [moon](https://moonrepo.dev/docs/install) (optional; this repo targets the **moon v1**-style project config: `layer`, not `type`)
- A Git repo with **at least two commits** (moon may call `git` with `HEAD~1` for change detection). If you see that error once, run: `git commit --allow-empty -m "chore: base"`

## Setup

```bash
bun install
```

## Commands

```bash
# Lint (ESLint + @stylistic — see https://eslint.style/rules)
bun run lint
bun run lint:fix
moon run :lint

# Build libraries (via moon, if installed)
moon run :build

# Or build each package
(cd packages/inertia-server && bun run build)
(cd packages/inertia-hono && bun run build)

# Tests
moon run :test
# Or
(cd packages/inertia-server && bun run test)
(cd packages/inertia-hono && bun run test)
(cd apps/playground && bun run test)

# Playground: Hono (3000) + Vite (5173) together — open http://localhost:3000
moon run playground:dev
# Or, after `bun install`:
(cd apps/playground && bun run dev)

# Optional: point the HTML shell at another Vite origin
PLAYGROUND_VITE_ORIGIN=http://127.0.0.1:5173 bun run dev:server
```

## Publishing to npm

1. Bump versions in `packages/inertia-server/package.json` and `packages/inertia-hono/package.json`.
2. Ensure `inertia-hono` lists a matching semver for `inertia-server` in `dependencies`.
3. Build and pack:

```bash
(cd packages/inertia-server && bun run build && npm pack)
(cd packages/inertia-hono && bun run build && npm pack)
```

4. Publish **`inertia-server` first**, then **`inertia-hono`**.

```bash
(cd packages/inertia-server && npm publish --access public)
(cd packages/inertia-hono && npm publish --access public)
```

## Hono usage sketch

```ts
import { Hono } from 'hono'
import { createInertia, type InertiaVariables } from 'inertia-hono'

const { middleware, instance } = createInertia({
  version: process.env.ASSET_VERSION ?? '1',
  share: async (c) => ({ requestId: c.req.header('x-request-id') }),
})

const app = new Hono<{ Variables: InertiaVariables }>()
app.use(middleware)

app.get('/', (c) => instance.render(c, 'Home', { user: { name: 'Ada' } }))
```

Use `c.var.inertia` inside handlers if you prefer context over `instance`.
