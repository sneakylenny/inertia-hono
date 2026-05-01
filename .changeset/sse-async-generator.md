---
'@sneakylenny/inertia-hono': patch
---

Add async-generator support to `sse()`. Handlers can now `yield` structured SSE envelopes (`{ data, event?, id?, retry? }`) or plain values in addition to the existing `await send(...)` callback style.
