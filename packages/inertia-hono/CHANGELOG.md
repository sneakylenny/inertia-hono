# inertia-hono

## 0.4.1

### Patch Changes

- bc8d9e8: Update documentation for once props, merge props, and infinite scroll.

## 0.4.0

### Minor Changes

- b640d7b: Add support for [merge props](https://inertiajs.com/docs/v3/data-props/merging-props) and [infinite scroll](https://inertiajs.com/docs/v3/data-props/infinite-scroll). Wrap a prop in `merge()` / `deepMerge()` so the client appends/prepends arrays and merges objects on partial reloads instead of replacing them; chain `.prepend()`, `.deep()`, `.match(field)`, and `.at(path)`. Use `scroll(items, metadata)` to drive Inertia's `<InfiniteScroll>` — it reads the client's merge-intent header to append vs prepend and emits the `scrollProps` pagination metadata. The framework-agnostic `offsetPaginate()` and `cursorPaginate()` helpers build that metadata from any data source, so no ORM integration is required.
- 5c0fb47: Add support for [once props](https://inertiajs.com/docs/v3/data-props/once-props). Wrap a prop in `once()` to resolve it on the server a single time; the client caches the value and skips it on subsequent visits via `X-Inertia-Except-Once-Props`. Chain `.fresh()`, `.until(seconds | Date)`, `.as(key)`, and `.optional()` to customise caching. Composes with partial reloads and honors `X-Inertia-Reset`.

### Patch Changes

- Updated dependencies [b640d7b]
- Updated dependencies [5c0fb47]
  - @sneakylenny/inertia-server@0.4.0

## 0.3.5

### Patch Changes

- dfb247d: Update documentation

## 0.3.4

### Patch Changes

- 5db5d99: Fix a typo of a link in the docs
- a1d01dc: Add async-generator support to `sse()`. Handlers can now `yield` structured SSE envelopes (`{ data, event?, id?, retry? }`) or plain values in addition to the existing `await send(...)` callback style.

## 0.3.3

### Patch Changes

- 4649a33: Improve README documentation: reorganised the features section to place Redirect Back before Form Validation Errors, rewrote the `back()` description to focus on the redirect-with-data pattern, added options tables for `back()`, `defer()`, `location()`, `toInertiaErrors()`, and `inertiaValidator()` in the API reference, and cleaned up various descriptions for clarity.

## 0.3.2

### Patch Changes

- 3fd8ff5: Fix package scope rename issues

## 0.3.1

### Patch Changes

- 6a7988a: Include README.md in the published npm package.
- Updated dependencies [6a7988a]
  - @sneakylenny/inertia-server@0.3.1

## 0.3.0

### Minor Changes

- d8427e0: Rename all packages under the `@sneakylenny` npm scope.

  - `inertia-hono` → `@sneakylenny/inertia-hono`
  - `inertia-server` → `@sneakylenny/inertia-server`
  - `create-inertia-hono` → `@sneakylenny/create-inertia-hono`

### Patch Changes

- Updated dependencies [d8427e0]
  - @sneakylenny/inertia-server@0.3.0

## 0.2.0

### Minor Changes

- b482e29: Initial release

### Patch Changes

- Updated dependencies [b482e29]
  - inertia-server@0.2.0
