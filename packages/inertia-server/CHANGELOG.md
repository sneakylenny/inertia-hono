# inertia-server

## 0.4.0

### Minor Changes

- b640d7b: Add support for [merge props](https://inertiajs.com/docs/v3/data-props/merging-props) and [infinite scroll](https://inertiajs.com/docs/v3/data-props/infinite-scroll). Wrap a prop in `merge()` / `deepMerge()` so the client appends/prepends arrays and merges objects on partial reloads instead of replacing them; chain `.prepend()`, `.deep()`, `.match(field)`, and `.at(path)`. Use `scroll(items, metadata)` to drive Inertia's `<InfiniteScroll>` — it reads the client's merge-intent header to append vs prepend and emits the `scrollProps` pagination metadata. The framework-agnostic `offsetPaginate()` and `cursorPaginate()` helpers build that metadata from any data source, so no ORM integration is required.
- 5c0fb47: Add support for [once props](https://inertiajs.com/docs/v3/data-props/once-props). Wrap a prop in `once()` to resolve it on the server a single time; the client caches the value and skips it on subsequent visits via `X-Inertia-Except-Once-Props`. Chain `.fresh()`, `.until(seconds | Date)`, `.as(key)`, and `.optional()` to customise caching. Composes with partial reloads and honors `X-Inertia-Reset`.

## 0.3.1

### Patch Changes

- 6a7988a: Include README.md in the published npm package.

## 0.3.0

### Minor Changes

- d8427e0: Rename all packages under the `@sneakylenny` npm scope.

  - `inertia-hono` → `@sneakylenny/inertia-hono`
  - `inertia-server` → `@sneakylenny/inertia-server`
  - `create-inertia-hono` → `@sneakylenny/create-inertia-hono`

## 0.2.0

### Minor Changes

- b482e29: Initial release
