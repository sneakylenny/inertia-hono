---
'@sneakylenny/inertia-server': minor
'@sneakylenny/inertia-hono': minor
---

Add support for [merge props](https://inertiajs.com/docs/v3/data-props/merging-props) and [infinite scroll](https://inertiajs.com/docs/v3/data-props/infinite-scroll). Wrap a prop in `merge()` / `deepMerge()` so the client appends/prepends arrays and merges objects on partial reloads instead of replacing them; chain `.prepend()`, `.deep()`, `.match(field)`, and `.at(path)`. Use `scroll(items, metadata)` to drive Inertia's `<InfiniteScroll>` — it reads the client's merge-intent header to append vs prepend and emits the `scrollProps` pagination metadata. The framework-agnostic `offsetPaginate()` and `cursorPaginate()` helpers build that metadata from any data source, so no ORM integration is required.
