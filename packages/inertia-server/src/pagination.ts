import type { ScrollMetadata } from './scroll.js'

/**
 * Build {@link ScrollMetadata} for classic offset/page-number pagination.
 *
 * @example
 * scroll(rows, offsetPaginate({ page, perPage: 20, total }))
 */
export function offsetPaginate(opts: {
  /** 1-based current page number. */
  page: number
  /** Items requested per page. */
  perPage: number
  /** Total number of items across all pages. */
  total: number
  /** Query-string parameter name (default `page`). */
  pageName?: string
}): ScrollMetadata {
  const { page, perPage, total, pageName = 'page' } = opts
  const lastPage = perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1
  return {
    pageName,
    currentPage: page,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < lastPage ? page + 1 : null,
  }
}

/**
 * Build {@link ScrollMetadata} for cursor-based pagination using the
 * over-fetch pattern: query `perPage + 1` rows and pass them all in. The extra
 * row (if present) signals a next page and is trimmed from the returned `items`.
 *
 * The emitted `previousPage` / `nextPage` are the boundary cursors; your handler
 * decides how to interpret them (fetch rows after `nextPage`, before
 * `previousPage`) when the client requests them.
 *
 * @example
 * const { items, metadata } = cursorPaginate({
 *   items: rows,            // up to perPage + 1 rows
 *   perPage: 20,
 *   getCursor: (r) => r.id,
 *   hasPrevious: Boolean(currentCursor),
 *   currentCursor,
 * })
 * return inertia.render('Feed', { posts: scroll(items, metadata) })
 */
export function cursorPaginate<T>(opts: {
  /** Up to `perPage + 1` rows; the surplus row marks a next page. */
  items: T[]
  /** Items shown per page. */
  perPage: number
  /** Extract the cursor value from a row (e.g. its id or a composite key). */
  getCursor: (item: T) => number | string
  /** Whether a previous page exists (typically `true` once the user has paged forward). */
  hasPrevious?: boolean
  /** Cursor of the current page boundary, surfaced as `currentPage`. */
  currentCursor?: number | string | null
  /** Query-string parameter name (default `cursor`). */
  pageName?: string
}): { items: T[], metadata: ScrollMetadata } {
  const { perPage, getCursor, hasPrevious = false, currentCursor = null, pageName = 'cursor' } = opts
  const hasNext = opts.items.length > perPage
  const items = hasNext ? opts.items.slice(0, perPage) : opts.items
  const first = items[0]
  const last = items[items.length - 1]
  return {
    items,
    metadata: {
      pageName,
      currentPage: currentCursor,
      previousPage: hasPrevious && first !== undefined ? getCursor(first) : null,
      nextPage: hasNext && last !== undefined ? getCursor(last) : null,
    },
  }
}
