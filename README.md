> [!WARNING]
> This project has been published but is not yet production-tested and may contain bugs. The API may still change between releases. PRs are very welcome, as my time to work on this is limited.

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

Merge data that should be included in the response props (auth state, flash messages, etc.) via `createInertia` or the `share` helper.

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

Long-running queries or expensive computations can be deferred to avoid blocking the response. The client receives the page right away, then Inertia loads deferred props in follow-up requests. Props in the same group are batched into a single request for efficiency.

See [Deferred props](https://inertiajs.com/deferred-props) in the Inertia docs for more details.

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

Useful for live dashboards, notifications, or progress updates. Open an SSE response from any Hono route with a request-scoped, JSON-friendly API.

> [!NOTE]
> This feature is specific to `@sneakylenny/inertia-hono` and is not part of the core Inertia.js protocol.

Two handler styles are supported:

**Callback** — call `send(data, init?)` imperatively. Useful when events are pushed from external sources (subscriptions, event emitters):

```ts
import { sse } from '@sneakylenny/inertia-hono'

app.get('/events', (c) =>
  sse(c, async (send) => {
    await send({ status: 'connected' }, { event: 'status' })
    await send('ready')
  }),
)
```

**Async generator** — `yield` structured SSE envelopes. Each yielded value is either a plain payload (JSON-encoded automatically) or a structured object with `data`, `event`, `id`, and/or `retry` fields:

```ts
app.get('/events', (c) =>
  sse(c, async function* () {
    // structured envelope — event name, id, and retry are optional
    yield {
      data: { status: 'connected' },
      event: 'status',
      id: '1',
      retry: 5000,
    }
    // plain payload — serialized as: data: ready
    yield 'ready'
  }),
)
```

> [!NOTE]
> Objects with a `data` key and **only** the fields `data`, `event`, `id`, `retry` are treated as SSE envelopes. Any object with additional fields is serialized as a plain JSON payload.

Both styles accept an optional `options` argument and work with `c.var.inertia.sse(handler, options)`.

See [`sse(c, handler, options?)`](#ssec-handler-options) in the API reference for the full option set.

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

### Redirect Back

> [!NOTE]
> Requires `flashSecret` to be set in `createInertia({ flashSecret })`.

`back(c, payload?)` redirects (`303`) to the `Referer`, optionally carrying a one-shot data payload. The payload is stashed in a signed cookie; on the next request the middleware consumes it and merges the data into shared props automatically — useful for flashing validation errors, toast messages, or any other ephemeral state to the page you land on.

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

### Form Validation Errors

Two options: one uses the Hono standard validator under the hood for zero-config setup, the other lets you bring your own validator for full control.

**Zero-config (recommended)**: By using `inertiaValidator` you can easily validate standard-schema supported schema's. It wraps [`@hono/standard-validator`](https://github.com/honojs/middleware/tree/main/packages/standard-validator) and auto-flashes errors through [`back()`](#redirect-back) adding the errors automatically to `page.props.errors`. Import it from the `@sneakylenny/inertia-hono/validator` subpath:

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

See [`inertiaValidator`](#inertiavalidatortarget-schema-options) in the API reference for available options.

> [!NOTE]
> Requires `createInertia({ flashSecret })` and `@hono/standard-validator` as a peer dependency.

**Full control:** For custom failure handling (e.g. rendering the same page with extra context), use `toInertiaErrors` to map Standard Schema issues (Valibot, Zod v3+, ArkType, Effect Schema, ...) into Inertia's [`errors` page prop](https://inertiajs.com/docs/v3/the-basics/forms#form-errors) yourself. Keys are dotted paths (e.g. `items.0.name`); first issue per path wins.

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

> [!NOTE]
> When every issue is pathless (e.g. the body isn't even an object), the message lands under a single `form` key — override with `toInertiaErrors(issues, { fallbackKey: "text" })`.

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

**Vite:** `@sneakylenny/inertia-hono` exports `createViteHtmlRenderer` and `readViteManifest` helpers. In development, the renderer wires `@vite/client` and your entry script. In production, it reads Vite's [`build.manifest`](https://vite.dev/config/build-options.html#build-manifest) to emit the correct `<script>` and `<link>` tags. See [`packages/inertia-hono/src/vite.ts`](packages/inertia-hono/src/vite.ts) for details.

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

I currently don't plan to support SSR from this package as I think trying to make SSR work with Inertia is cumbersome already, trying to make it work with this 3rd party plugin would be even worse. Unless someone can show me a DX friendly way of implementing SSR into this repo. Until then, I'm not convinced it belongs here. If your project requires SSR I strongly suggest looking at frameworks like [Next](https://nextjs.org/), [Nuxt](https://nuxt.com/) or [SvelteKit](https://svelte.dev/docs/kit/introduction) as alternative options.

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

Render an Inertia page and optionally pass props to it. Returns a `Response`.

### `share(c, props)`

Merge props into the current request's shared data. Can be called from any middleware or handler before `render`.

### `location(c, url, status?)`

Trigger an [external redirect](https://inertiajs.com/redirects#external-redirects). On Inertia requests returns a `409` with `X-Inertia-Location`; on regular requests performs a standard HTTP redirect.

**Parameters:**

| Parameter | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| `url`     | `string` | External URL to redirect to.       |
| `status`  | `number` | HTTP status code (default: `302`). |

### `back(c, payload?, options?)`

Redirect back to the `Referer` (`303` by default) with an optional `{ errors, flash }` payload stashed in a signed cookie and surfaced as shared props on the next request. See [Redirect Back](#redirect-back). Requires `createInertia({ flashSecret })`.

**Parameters:**

| Parameter | Type                                                                   | Description                                                                                                               |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `payload` | `{ errors?: Record<string, string>, flash?: Record<string, unknown> }` | Optional data to flash to the next request via a signed cookie.                                                           |
| `options` | `{ fallback?: string, status?: number }`                               | `fallback` is the redirect target when `Referer` is missing (default: `/`); `status` is the HTTP status (default: `303`). |

### `defer(fn, group?)`

Mark a prop for [deferred loading](https://inertiajs.com/deferred-props) after returning the page. Props in the same `group` are fetched together.

**Parameters:**

| Parameter | Type                 | Description                                                                       |
| --------- | -------------------- | --------------------------------------------------------------------------------- |
| `fn`      | `() => Promise<any>` | Async function that resolves the prop value.                                      |
| `group`   | `string`             | Optional group name; props in the same group are fetched together in one request. |

### `partial.lazy(fn)` / `partial.optional(fn)` / `partial.always(fn)`

Control prop evaluation during [partial reloads](https://inertiajs.com/partial-reloads).

### `toInertiaErrors(issues, options?)`

Map [Standard Schema](https://standardschema.dev/) issues to an errors object which Inertia expects (`Record<string, string>`, dot-notated keys). See [Form Validation Errors](#form-validation-errors).

**Options:**

| Option        | Type     | Description                                                  |
| ------------- | -------- | ------------------------------------------------------------ |
| `fallbackKey` | `string` | Key to use when all issues are pathless (default: `"form"`). |

### `inertiaValidator(target, schema, options?)`

Imported from `@sneakylenny/inertia-hono/validator`. Wraps [`@hono/standard-validator`](https://github.com/honojs/middleware/tree/main/packages/standard-validator) with automatic error flashing via [`back()`](#backc-payload-options). On validation failure, issues are mapped to Inertia errors and flashed to the next request via a signed cookie — no manual error handling needed.

**Options:**

| Option   | Type                                     | Description                                                                 |
| -------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `errors` | `{ fallbackKey?: string }`               | Forwarded to [`toInertiaErrors()`](#toinertiaerrorsissues-options) options. |
| `back`   | `{ fallback?: string, status?: number }` | Forwarded to [`back()`](#backc-payload-options) options.                    |

## Context-Bound API

As an alternative to the standalone `render` and `share` functions, you can use the context-bound versions available on `c.var.inertia`:

```ts
app.get('/posts', (c) => {
  c.var.inertia.share({ user: getUser(c) })
  return c.var.inertia.render('Posts', { posts: [] })
})
```

## Playground

The hosted demo above is built from this repo. This repository uses [Bun](https://bun.sh/) as its runtime and package manager — Bun is **required**. [Moon](https://moonrepo.dev/moon) and [Proto](https://moonrepo.dev/proto) are **strongly recommended** for task orchestration and toolchain management.

With Moon installed, run the playground from the repository root:

```bash
moon run playground:dev
```

Without Moon, you can run it directly with Bun:

```bash
cd apps/playground
bun install
bun dev
```

The app runs with `NODE_ENV=production` when built, and serves the Vite-built client from the same server. You can also set `PLAYGROUND_PORT` if you need a different port (default is `3000`).

## Disclaimer

This project was built with the assistance of AI.

## License

MIT
