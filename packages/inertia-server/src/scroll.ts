/** @internal */
export const INERTIA_SCROLL = Symbol.for('inertia.scroll')

/** Header the client sends on a "load more" request to pick append vs prepend. */
export const INERTIA_MERGE_INTENT_HEADER = 'x-inertia-infinite-scroll-merge-intent'

/**
 * Pagination metadata the client needs to drive infinite scroll. `previousPage`
 * and `nextPage` are the page identifiers (numbers, cursors, …) to request next,
 * or `null` when there is nothing more in that direction.
 */
export type ScrollMetadata = {
  /** Query-string parameter the client sets when loading a page, e.g. `page`. */
  pageName: string
  currentPage: number | string | null
  previousPage: number | string | null
  nextPage: number | string | null
}

/** A single entry in the page object's `scrollProps` map. */
export type InertiaScrollPropMeta = ScrollMetadata & {
  /** When `true`, the client discards accumulated data before applying this response. */
  reset: boolean
}

type ResetCondition = boolean | (() => boolean | Promise<boolean>)

/**
 * A prop wired for [infinite scroll](https://inertiajs.com/docs/v3/data-props/infinite-scroll).
 *
 * Built on {@link InertiaMergeProp merge props}: the array value is appended or
 * prepended to the existing list depending on the client's merge intent, and the
 * page object carries a `scrollProps` entry with the pagination metadata.
 */
export type InertiaScrollProp<T = unknown> = {
  readonly [INERTIA_SCROLL]: true
  readonly fn: () => T[] | Promise<T[]>
  readonly metadata: ScrollMetadata
  readonly matchOnFields: readonly string[]
  readonly resetCondition: ResetCondition
  /** Match existing items by field name(s) to update in place instead of duplicating. */
  match(field: string | string[]): InertiaScrollProp<T>
  /** Tell the client to reset accumulated data (e.g. after a filter change). */
  resetWhen(condition?: ResetCondition): InertiaScrollProp<T>
}

function normalizeItems<T>(items: T[] | (() => T[] | Promise<T[]>)): () => T[] | Promise<T[]> {
  return typeof items === 'function' ? (items as () => T[] | Promise<T[]>) : () => items
}

function makeScrollProp<T>(
  fn: () => T[] | Promise<T[]>,
  metadata: ScrollMetadata,
  matchOnFields: readonly string[],
  resetCondition: ResetCondition,
): InertiaScrollProp<T> {
  return {
    [INERTIA_SCROLL]: true,
    fn,
    metadata,
    matchOnFields,
    resetCondition,
    match(field: string | string[]) {
      const fields = Array.isArray(field) ? field : [field]
      return makeScrollProp(fn, metadata, [...matchOnFields, ...fields], resetCondition)
    },
    resetWhen(condition: ResetCondition = true) {
      return makeScrollProp(fn, metadata, matchOnFields, condition)
    },
  }
}

/**
 * Mark a prop for [infinite scroll](https://inertiajs.com/docs/v3/data-props/infinite-scroll).
 *
 * Provide the page of `items` and its {@link ScrollMetadata} (use
 * `offsetPaginate` / `cursorPaginate` to build it). On a "load more" partial
 * reload the items are appended or prepended based on the client's merge intent
 * header; the resolved page object carries a matching `scrollProps` entry.
 */
export function scroll<T>(
  items: T[] | (() => T[] | Promise<T[]>),
  metadata: ScrollMetadata,
): InertiaScrollProp<T> {
  return makeScrollProp(normalizeItems(items), metadata, [], false)
}

export function isInertiaScrollProp(value: unknown): value is InertiaScrollProp {
  return (
    typeof value === 'object'
    && value !== null
    && INERTIA_SCROLL in value
    && (value as InertiaScrollProp)[INERTIA_SCROLL] === true
    && typeof (value as InertiaScrollProp).fn === 'function'
  )
}
