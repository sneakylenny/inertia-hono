> [!WARNING]
> This project is an early proof of concept and is not yet stable. It will soon be published, but the API is not production-ready and may change significantly between releases. There is plenty of room for improvement — PRs are very welcome, as my time to work on this is limited.

# inertia-hono

[![npm](https://img.shields.io/npm/v/@sneakylenny/inertia-hono.svg?style=for-the-badge)](https://www.npmjs.com/package/@sneakylenny/inertia-hono)
[![CI](https://img.shields.io/github/actions/workflow/status/sneakylenny/inertia-hono/ci.yml?style=for-the-badge&branch=main&label=CI)](https://github.com/sneakylenny/inertia-hono/actions/workflows/ci.yml?query=branch%3Amain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Inertia.js v3](https://inertiajs.com/) server-side adapter for [Hono](https://hono.dev/).

Build modern single-page apps with Vue, React, or Svelte **without building an API** -- Inertia gives you a full SPA experience while keeping routing and data on the server. This adapter brings first-class Inertia support to the Hono web framework.

**Live demo:** [inertia-hono-playground.sneakylenny.com](https://inertia-hono-playground.sneakylenny.com/) — the [`apps/playground`](apps/playground/) app (Hono, Vue 3, Vite).

> [!NOTE]
> This monorepo also contains [`@sneakylenny/inertia-server`](packages/inertia-server/), a framework-agnostic library that implements the [Inertia v3 protocol](https://inertiajs.com/docs/v3/core-concepts/the-protocol). `@sneakylenny/inertia-hono` is built on top of it and re-exports its utilities, so you only need to install `@sneakylenny/inertia-hono`.

## Install

```bash
npm install @sneakylenny/inertia-hono hono
# or
bun add @sneakylenny/inertia-hono hono
```

## Scaffolding

Scaffold a new app with **Hono**, **Inertia.js v3**, **Vue 3**, **Vite**, and **Tailwind CSS** using [`@sneakylenny/create-inertia-hono`](packages/create-inertia-hono/):

```bash
npm create @sneakylenny/inertia-hono@latest
# or
bun create @sneakylenny/inertia-hono
# or
pnpm create @sneakylenny/inertia-hono
```

Pass the target directory as the first argument, or run the command without arguments and enter a project name when prompted. The CLI copies the template, sets `package.json` `name` to the folder name, then suggests `install` and `dev` using your detected package manager.

## Quick Start

```ts
import { Hono } from 'hono'
import {
  createInertia,
  render,
  type InertiaVariables,
} from '@sneakylenny/inertia-hono'

const { middleware } = createInertia({
  version: '1',
})

const app = new Hono<{ Variables: InertiaVariables }>()

app.use(middleware)

app.get('/', (c) => render(c, 'Home', { user: { name: 'Ada' } }))

export default app
```

On the first visit, the server returns a full HTML page with the Inertia page object embedded. Subsequent navigation happens over XHR -- Inertia swaps components client-side without full page reloads.

## Features

### Shared Data

Pass data that every response should include (auth state, flash messages, etc.) via `createInertia` or the `share` helper.

Global shared data via `createInertia`:

```ts
const { middleware } = createInertia({
  version: '1',
  share: async (c) => ({
    appName: 'My App',
    auth: { user: getUser(c) },
  }),
})
```

Route-scoped sharing from middleware or handlers with `share(c, props)`:

```ts
import { share } from '@sneakylenny/inertia-hono'

const authMiddleware: MiddlewareHandler = async (c, next) => {
  share(c, { user: await getUser(c) })
  await next()
}
```

Props merge in order: `createInertia share` -> `share()` calls -> `render()` props, with later values winning on key conflicts.

See [Shared data](https://inertiajs.com/shared-data) in the Inertia docs.

### Deferred Props

Heavy data that shouldn't block the first paint can be deferred. The client receives the page immediately, then Inertia fetches deferred props in follow-up requests.

```ts
import { defer, render } from '@sneakylenny/inertia-hono'

app.get('/dashboard', (c) =>
  render(c, 'Dashboard', {
    summary: { revenue: 1000 },

    // Loaded after first paint in a follow-up request
    recentOrders: defer(async () => {
      return await db.orders.recent()
    }),

    // Group related props into a single follow-up request
    analytics: defer(() => fetchAnalytics(), 'stats'),
    trends: defer(() => fetchTrends(), 'stats'),
  }),
)
```

See [Deferred props](https://inertiajs.com/deferred-props) in the Inertia docs.

### Server-Sent Events (SSE)

For live dashboards, notifications, or progress updates, open an SSE response from a normal Hono route. The helper keeps the API request-scoped and JSON-friendly:

```ts
import { sse } from '@sneakylenny/inertia-hono'

app.get('/events', (c) =>
  sse(c, async (send) => {
    await send({ status: 'connected' }, { event: 'status' })
    await send('ready')
  }),
)
```

You can also call `c.var.inertia.sse(...)` after the middleware has been registered.

### Partial Reloads

Control which props are evaluated during [partial reloads](https://inertiajs.com/partial-reloads) using `partial.lazy`, `partial.optional`, and `partial.always`:

```ts
import { partial, render } from '@sneakylenny/inertia-hono'

app.get('/users', (c) =>
  render(c, 'Users', {
    // Only evaluated when the key survives partial-reload filtering
    users: partial.lazy(() => db.users.list()),

    // Omitted on full visits, included only when explicitly requested
    filters: partial.optional(() => getAvailableFilters()),

    // Always included, even on narrow partial reloads
    permissions: partial.always(() => getPermissions()),
  }),
)
```

See [Partial reloads](https://inertiajs.com/partial-reloads) in the Inertia docs.

### Form Validation Errors

Two options, same validator engine under the hood — pick the one that fits the route:

**Zero-config: `inertiaValidator`** (recommended for the common case). Wraps [`@hono/standard-validator`](https://github.com/honojs/middleware/tree/main/packages/standard-validator) and auto-flashes failures through [`back()`](#redirect-back-with-flashed-errors) so `page.props.errors` Just Works. Import it from the `inertia-hono/validator` subpath (keeps the main bundle free of validator code):

```ts
import { inertiaValidator } from '@sneakylenny/inertia-hono/validator'
import * as v from 'valibot'

const schema = v.object({
  text: v.pipe(v.string(), v.minLength(1, 'Add some text.')),
})

app.post('/todos', inertiaValidator('json', schema), (c) => {
  const { text } = c.req.valid('json') // fully typed
  // ...
})
```

Options flow through to the helpers: `inertiaValidator(target, schema, { errors: { fallbackKey: "text" }, back: { fallback: "/todos" } })`. Requires `createInertia({ flashSecret })` and `@hono/standard-validator` as a peer dep.

**Full control: `toInertiaErrors`**. If you need custom failure handling (e.g. rendering the same page with extra context), map Standard Schema issues (Valibot, Zod v3+, ArkType, Effect Schema, ...) into Inertia's [`errors` page prop](https://inertiajs.com/docs/v3/the-basics/forms#form-errors) yourself. Keys are dotted paths (e.g. `items.0.name`), first issue per path wins.

```ts
import { sValidator } from '@hono/standard-validator'
import { back, toInertiaErrors } from '@sneakylenny/inertia-hono'

app.post(
  '/todos',
  sValidator('json', schema, (result, c) => {
    if (result.success) return
    return back(c, { errors: toInertiaErrors(result.error) })
  }),
  (c) => {
    const { text } = c.req.valid('json')
    // ...
  },
)
```

When every issue is pathless (e.g. the body isn't even an object), the message lands under a single `form` key — override with `toInertiaErrors(issues, { fallbackKey: "text" })`.

### Redirect Back with Flashed Errors

`back(c, { errors, flash })` implements Inertia's canonical [Post/Redirect/Get flow](https://inertiajs.com/redirects): it stashes a one-shot payload in a signed cookie and redirects (303) to the `Referer`. On the next request, the middleware consumes the cookie and exposes `errors` / `flash` as shared props automatically, so any page you land on already has them available without re-rendering by hand.

Enable it by passing a `flashSecret` to `createInertia`:

```ts
const { middleware } = createInertia({
  version: '1',
  flashSecret: process.env.FLASH_SECRET!,
})
```

Then use `back()` from handlers and validator hooks:

```ts
import { back } from '@sneakylenny/inertia-hono'

app.post(
  '/todos',
  sValidator('json', schema, (result, c) => {
    if (result.success) return
    return back(c, { errors: toInertiaErrors(result.error) })
  }),
  (c) => {
    const result = addTodo(c.req.valid('json').text)
    if (!result.ok) return back(c, { errors: { text: 'At the limit.' } })
    return c.redirect('/todos', 303)
  },
)
```

Notes:

- Uses `303 See Other` by default so browsers and `@inertiajs/vue3`/`react`/`svelte` follow with a `GET`.
- Falls back to `options.fallback` (default `/`) when `Referer` is missing or points to a different origin — no open-redirect risk.
- `flash` is available for generic one-shot messages (toasts, etc.) and surfaces as `page.props.flash`.
- The cookie is HMAC-signed with your `flashSecret` (via Hono's [`setSignedCookie`](https://hono.dev/docs/helpers/cookie#signed-cookies)), so tampered payloads are silently discarded.

### External Redirects

Use `location` for redirects that should trigger a full page visit (external URLs or routes outside the SPA):

```ts
import { location } from '@sneakylenny/inertia-hono'

app.get('/leave', (c) => location(c, 'https://example.com'))
```

On Inertia requests this returns a `409` with `X-Inertia-Location` so the client does a full `window.location` navigation. On regular requests it performs a standard HTTP redirect.

See [External redirects](https://inertiajs.com/redirects#external-redirects) in the Inertia docs.

### HTML Shell

By default, first-visit responses use a minimal HTML document. Override it with `renderHtml` to integrate with Vite, inject stylesheets, or add meta tags.

**Vite:** `@sneakylenny/inertia-hono` exports `createViteHtmlRenderer` and `readViteManifest` (see `packages/inertia-hono/src/vite.ts`) (see `packages/inertia-hono/src/vite.ts`) so you do not have to hand-write the shell. The helper wires `@vite/client` and your entry in development, and in production reads Vite’s [`build.manifest`](https://vite.dev/config/build-options.html#build-manifest) (via `readViteManifest(distDir)`) to emit the right `<script>` / `<link>` tags. It is implemented with Hono’s [`html`](https://hono.dev/docs/helpers/html) tag helper and escapes embedded page JSON safely.

```ts
import {
  createInertia,
  createViteHtmlRenderer,
  readViteManifest,
} from '@sneakylenny/inertia-hono'

const isDev = process.env.NODE_ENV !== 'production'
const manifest = isDev ? null : await readViteManifest('./dist')

const { middleware } = createInertia({
  version: '1',
  renderHtml: createViteHtmlRenderer({
    dev: isDev,
    entry: 'src/main.ts',
    manifest,
  }),
})
```

For full control, you can still return your own HTML string from `renderHtml`:

```ts
const { middleware } = createInertia({
  version: '1',
  renderHtml: async ({ page, pageJson, rootElementId }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${page.component}</title>
      <script type="module" src="/src/main.ts"></script>
    </head>
    <body>
      <script data-page="app" type="application/json">${pageJson}</script>
      <div id="${rootElementId}"></div>
    </body>
    </html>
  `,
})
```

### History Encryption & Clearing

Control the Inertia [history encryption](https://inertiajs.com/history-encryption) behavior:

```ts
const { middleware } = createInertia({
  version: '1',
  encryptHistory: true, // Encrypt page data in browser history
  clearHistory: true, // Clear history state on this response
})
```

### SSR

I don't plan to support SSR as I think trying to make SSR work with Inertia is cumbersome already, trying to make it work with this 3rd party plugin would be even worse. Unless someone can show me a DX friendly way of implementing SSR into this repo, I'm not convinced it belongs here. If your project requires SSR I suggest looking at frameworks like [Next](https://nextjs.org/), [Nuxt](https://nuxt.com/) or [SvelteKit](https://svelte.dev/docs/kit/introduction) as alternative options.

## API Reference

### `createInertia(options)`

Creates the Inertia middleware. Returns `{ middleware }`.

| Option             | Type                                           | Description                                                                |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `version`          | `string \| number \| (() => string \| number)` | Asset version for [cache busting](https://inertiajs.com/asset-versioning). |
| `share`            | `(c: Context) => Record<string, unknown>`      | Global shared props resolved on every request.                             |
| `renderHtml`       | `(ctx) => string \| Promise<string>`           | Custom HTML document for first visits.                                     |
| `rootElementId`    | `string`                                       | Root element ID (default: `"app"`).                                        |
| `encryptHistory`   | `boolean`                                      | Enable history encryption.                                                 |
| `clearHistory`     | `boolean`                                      | Clear history on response.                                                 |
| `preserveFragment` | `boolean`                                      | Preserve URL fragment on navigation.                                       |
| `flashSecret`      | `string`                                       | Secret used to sign the flash cookie powering `back()`.                    |
| `flashCookie`      | `InertiaFlashCookieOptions`                    | Override flash cookie attributes (path, sameSite, secure, ...).            |

### `render(c, component, props?)`

Render an Inertia page. Returns a `Response`.

### `share(c, props)`

Merge props into the current request's shared data. Can be called from any middleware or handler before `render`.

### `location(c, url, status?)`

Trigger an [external redirect](https://inertiajs.com/redirects#external-redirects). Defaults to `302`.

### `back(c, payload?, options?)`

Redirect back to the `Referer` (`303` by default) with an optional `{ errors, flash }` payload flashed into a signed cookie. Surfaces as shared props on the next request. See [Redirect Back with Flashed Errors](#redirect-back-with-flashed-errors). Requires `createInertia({ flashSecret })`.

### `defer(fn, group?)`

Mark a prop for [deferred loading](https://inertiajs.com/deferred-props) after first paint. Props in the same `group` are fetched together.

### `partial.lazy(fn)` / `partial.optional(fn)` / `partial.always(fn)`

Control prop evaluation during [partial reloads](https://inertiajs.com/partial-reloads).

### `toInertiaErrors(issues, options?)`

Map [Standard Schema](https://standardschema.dev/) issues to Inertia's `errors` page prop (`Record<string, string>`, dot-notated keys). See [Form Validation Errors](#form-validation-errors).

### `inertiaValidator(target, schema, options?)`

Imported from `@sneakylenny/inertia-hono/validator`. Zero-config Standard Schema validator that auto-calls `back()` with flashed `errors` on failure. `options.errors` forwards to `toInertiaErrors`; `options.back` forwards to `back()`. See [Form Validation Errors](#form-validation-errors).

## Context-Bound API

As an alternative to the standalone `render` and `share` functions, you can use the context-bound versions available on `c.var.inertia`:

```ts
app.get('/posts', (c) => {
  c.var.inertia.share({ user: getUser(c) })
  return c.var.inertia.render('Posts', { posts: [] })
})
```

## Playground

The hosted demo above is built from this repo. You can run the playground app locally from the repository root:

```bash
cd apps/playground
bun install        # or npm install / pnpm install
bun dev            # or npm run dev / pnpm dev
```

The app runs with `NODE_ENV=production` when built, and serves the Vite-built client from the same server. You can also set `PLAYGROUND_PORT` if you need a different port (default is `3000`).

## Disclaimer

This project was built with the assistance of AI.

## License

MIT
