# Inertia + Hono monorepo

[Bun](https://bun.sh/) workspaces + [moon](https://moonrepo.dev/) + two publishable packages:

| Package | Description |
| --------|-------------|
| [`inertia-server`](packages/inertia-server/) | Framework-agnostic [Inertia v3 protocol](https://inertiajs.com/docs/v3/core-concepts/the-protocol) (headers, partial reloads, asset version 409, HTML vs JSON). |
| [`inertia-hono`](packages/inertia-hono/) | Thin Hono adapter that maps `Context` → `inertia-server` and returns `Response`. |
| [`apps/playground`](apps/playground/) | Small Hono app for manual checks (not published). |

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- [moon](https://moonrepo.dev/docs/install) 1.x (optional but recommended for `moon run :build`)

## Setup

```bash
bun install
```

## Commands

```bash
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

# Playground HTTP server (builds adapter dependency first with moon)
moon run playground:dev
# Or, after building packages once:
(cd apps/playground && bun run dev)
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
