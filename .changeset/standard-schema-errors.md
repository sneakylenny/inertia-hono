---
"inertia-hono": minor
"inertia-server": minor
---

Add `toInertiaErrors` helper that converts [Standard Schema](https://standardschema.dev/) issues into Inertia's `errors` page prop (`Record<string, string>` with dot-notated keys). Works with any Standard Schema library (Valibot, Zod, ArkType, Effect Schema, ...) and pairs naturally with [`@hono/standard-validator`](https://github.com/honojs/middleware/tree/main/packages/standard-validator). Also exports `issueDotPath` for rendering a single issue's path, plus matching `InertiaErrors` / `ToInertiaErrorsOptions` types.

Relax `render`'s context parameter to accept any Hono `Context` (same as `share` and `location`), so it can be called from validator hooks and generic middleware without casting `c as Context<{ Variables: InertiaVariables }>`. Throws a clearer error if the Inertia middleware isn't registered for the request.

Add `back(c, { errors, flash }?)` — Inertia's canonical [Post/Redirect/Get with flashed errors](https://inertiajs.com/redirects) flow. Stashes the payload in a signed cookie and redirects (303) to the same-origin `Referer`; the middleware consumes the cookie on the next request and surfaces `errors`/`flash` as shared props. Requires the new `createInertia({ flashSecret })` option. Also exports `inertia.flash(payload)` on the request-scoped instance plus the underlying `readInertiaFlash` / `writeInertiaFlash` primitives and `INERTIA_FLASH_COOKIE` constant for advanced use.

Fix: Inertia responses now preserve `Set-Cookie` and other headers accumulated on the Hono `Context` (previously they were dropped because responses were constructed via `new Response(...)` instead of `c.body(...)`). This is what makes the flash cookie round-trip correctly, and also means `setCookie` calls in your middleware survive into `render()` and `location()` responses.
