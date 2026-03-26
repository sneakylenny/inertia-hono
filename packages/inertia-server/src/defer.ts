import { readHeader, parseCommaList } from './headers.js'
import type { InertiaRequestLike } from './types.js'
import { isPartialDataReload } from './partial.js'

/** @internal */
export const INERTIA_DEFER = Symbol.for('inertia.defer')

const DEFAULT_DEFER_GROUP = 'default'

/** Marks a prop to load in a follow-up Inertia visit (see `deferredProps` on the page). */
export type InertiaDeferProp<T = unknown> = {
  readonly [INERTIA_DEFER]: true
  readonly group: string
  readonly fn: () => T | Promise<T>
}

function isDeferProp(value: unknown): value is InertiaDeferProp {
  return (
    typeof value === 'object'
    && value !== null
    && INERTIA_DEFER in value
    && (value as InertiaDeferProp)[INERTIA_DEFER] === true
    && typeof (value as InertiaDeferProp).fn === 'function'
  )
}

export function isInertiaDeferProp(value: unknown): value is InertiaDeferProp {
  return isDeferProp(value)
}

/**
 * Defer loading this prop until after the first page response, matching
 * [Inertia deferred props](https://inertiajs.com/docs/v3/data-props/deferred-props).
 * Optional `group` batches props into parallel follow-up requests (default group: `"default"`).
 */
export function defer<T>(
  fn: () => T | Promise<T>,
  group: string = DEFAULT_DEFER_GROUP,
): InertiaDeferProp<T> {
  return { [INERTIA_DEFER]: true, group, fn }
}

/**
 * Keys still pending for `deferredProps` on the page object.
 *
 * On a partial-data reload, props not listed in `X-Inertia-Partial-Data` are absent from
 * `resolvedProps` even when the client already merged them from a previous response.
 * For a defer group that is **not** targeted by this request: single-key groups are treated
 * as already satisfied client-side; multi-key groups stay listed until loaded together.
 */
export function pendingDeferKeys(
  mergedProps: Record<string, unknown>,
  resolvedProps: Record<string, unknown>,
  request: InertiaRequestLike,
  component: string,
): Record<string, string[]> {
  const keysByGroup = new Map<string, string[]>()
  for (const [key, val] of Object.entries(mergedProps)) {
    if (key === 'errors') continue
    if (!isDeferProp(val)) continue
    const g = val.group
    if (!keysByGroup.has(g)) keysByGroup.set(g, [])
    keysByGroup.get(g)!.push(key)
  }

  const partialDataReload = isPartialDataReload(request, component)
  const partialKeys = partialDataReload
    ? new Set(parseCommaList(readHeader(request.headers, 'x-inertia-partial-data')))
    : null

  const partialGroups = new Set<string>()
  if (partialKeys) {
    for (const pk of partialKeys) {
      const v = mergedProps[pk]
      if (isDeferProp(v)) partialGroups.add(v.group)
    }
  }

  const map: Record<string, string[]> = {}
  for (const [key, val] of Object.entries(mergedProps)) {
    if (key === 'errors') continue
    if (!isDeferProp(val)) continue
    if (key in resolvedProps && resolvedProps[key] !== undefined) continue

    const g = val.group

    if (!partialDataReload) {
      if (!map[g]) map[g] = []
      map[g].push(key)
      continue
    }

    if (partialGroups.has(g)) {
      if (!map[g]) map[g] = []
      map[g].push(key)
      continue
    }

    const groupKeys = keysByGroup.get(g) ?? []
    if (groupKeys.length > 1) {
      if (!map[g]) map[g] = []
      map[g].push(key)
    }
  }

  return map
}
