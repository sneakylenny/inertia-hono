---
'@sneakylenny/inertia-server': minor
'@sneakylenny/inertia-hono': minor
---

Add support for [once props](https://inertiajs.com/docs/v3/data-props/once-props). Wrap a prop in `once()` to resolve it on the server a single time; the client caches the value and skips it on subsequent visits via `X-Inertia-Except-Once-Props`. Chain `.fresh()`, `.until(seconds | Date)`, `.as(key)`, and `.optional()` to customise caching. Composes with partial reloads and honors `X-Inertia-Reset`.
