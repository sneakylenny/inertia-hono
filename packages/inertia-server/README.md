# inertia-server

Framework-agnostic helpers for implementing the [Inertia.js v3 protocol](https://inertiajs.com/docs/v3/core-concepts/the-protocol) on any JavaScript HTTP stack.

## Install

```bash
bun add inertia-server
# or
npm install inertia-server
```

## API

- `resolveInertia(input)` — returns either a **409** + `X-Inertia-Location`, or a **200** HTML document (first visit) / JSON page object (when `X-Inertia: true`).
- `filterPartialProps`, `getVersionMismatch`, `readHeader`, `isInertiaRequest`, `defaultHtmlShell` — building blocks adapters can reuse.

Map your framework’s request to `InertiaRequestLike` (`method`, `url` as path + query, `headers`), then convert the result to your framework’s response type.

See [`inertia-hono`](../inertia-hono/) for a Hono integration.
