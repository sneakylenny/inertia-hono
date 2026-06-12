/** @internal */
export const INERTIA_MERGE = Symbol.for('inertia.merge')

/** How the client combines the incoming value with what it already holds. */
export type InertiaMergeStrategy = 'shallow' | 'deep'

/**
 * A prop marked for client-side merging, matching
 * [Inertia merge props](https://inertiajs.com/docs/v3/data-props/merging-props).
 *
 * On a [partial reload](https://inertiajs.com/docs/v3/core-concepts/the-protocol#partial-reloads)
 * the client appends (or prepends) array values and merges objects instead of replacing
 * them. On a full page visit the prop is replaced as usual.
 *
 * The page object lists the prop path under `mergeProps` (append), `prependProps`
 * (prepend), or `deepMergeProps` (recursive), and any `matchOn` fields under
 * `matchPropsOn` so the client can update matching items instead of duplicating them.
 */
export type InertiaMergeProp<T = unknown> = {
  readonly [INERTIA_MERGE]: true
  readonly fn: () => T | Promise<T>
  readonly strategy: InertiaMergeStrategy
  readonly prependMode: boolean
  readonly matchOnFields: readonly string[]
  readonly atPath: string | undefined
  /** Merge recursively through nested objects/arrays instead of a shallow top-level merge. */
  deep(): InertiaMergeProp<T>
  /** Prepend incoming array items to the existing list instead of appending them. */
  prepend(): InertiaMergeProp<T>
  /**
   * Match existing array items by these field name(s) and update them in place
   * instead of appending duplicates (emitted as `matchPropsOn` entries).
   */
  match(field: string | string[]): InertiaMergeProp<T>
  /**
   * Target a nested array/object inside this prop (e.g. a paginator shaped like
   * `{ data: [...], meta: {...} }`). The emitted path becomes `<key>.<path>`.
   */
  at(path: string): InertiaMergeProp<T>
}

function normalizeValue<T>(value: T | (() => T | Promise<T>)): () => T | Promise<T> {
  return typeof value === 'function' ? (value as () => T | Promise<T>) : () => value
}

function makeMergeProp<T>(
  fn: () => T | Promise<T>,
  strategy: InertiaMergeStrategy,
  prependMode: boolean,
  matchOnFields: readonly string[],
  atPath: string | undefined,
): InertiaMergeProp<T> {
  return {
    [INERTIA_MERGE]: true,
    fn,
    strategy,
    prependMode,
    matchOnFields,
    atPath,
    deep() {
      return makeMergeProp(fn, 'deep', prependMode, matchOnFields, atPath)
    },
    prepend() {
      return makeMergeProp(fn, strategy, true, matchOnFields, atPath)
    },
    match(field: string | string[]) {
      const fields = Array.isArray(field) ? field : [field]
      return makeMergeProp(fn, strategy, prependMode, [...matchOnFields, ...fields], atPath)
    },
    at(path: string) {
      return makeMergeProp(fn, strategy, prependMode, matchOnFields, path)
    },
  }
}

/**
 * Mark a prop so the client merges new values into the existing prop on
 * [partial reloads](https://inertiajs.com/docs/v3/core-concepts/the-protocol#partial-reloads).
 *
 * Arrays are appended, objects shallow-merged. Chain `.deep()`, `.prepend()`,
 * `.match()`, and `.at()` to customise behaviour. Pass a value or a (possibly async)
 * thunk; the thunk is only evaluated when the prop survives partial filtering.
 */
export function merge<T>(value: T | (() => T | Promise<T>)): InertiaMergeProp<T> {
  return makeMergeProp(normalizeValue(value), 'shallow', false, [], undefined)
}

/**
 * Like {@link merge}, but recursively merges nested objects and arrays
 * (emitted under `deepMergeProps`).
 */
export function deepMerge<T>(value: T | (() => T | Promise<T>)): InertiaMergeProp<T> {
  return makeMergeProp(normalizeValue(value), 'deep', false, [], undefined)
}

export function isInertiaMergeProp(value: unknown): value is InertiaMergeProp {
  return (
    typeof value === 'object'
    && value !== null
    && INERTIA_MERGE in value
    && (value as InertiaMergeProp)[INERTIA_MERGE] === true
    && typeof (value as InertiaMergeProp).fn === 'function'
  )
}
