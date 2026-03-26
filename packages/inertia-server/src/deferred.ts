import { readHeader } from './headers.js'
import type { InertiaRequestLike } from './types.js'

/** @internal */
export const INERTIA_DEFERRED = Symbol.for('inertia.deferred')

export type InertiaDeferredKind = 'lazy' | 'optional' | 'always'

/** Deferred prop: resolved after partial-reload filtering (see Inertia lazy props). */
export type InertiaDeferredProp<T = unknown> = {
  readonly [INERTIA_DEFERRED]: InertiaDeferredKind
  readonly fn: () => T | Promise<T>
}

function isDeferredProp(value: unknown): value is InertiaDeferredProp {
  return (
    typeof value === 'object'
    && value !== null
    && INERTIA_DEFERRED in value
    && typeof (value as InertiaDeferredProp).fn === 'function'
  )
}

/** Wrap a lazy prop; evaluated only if the key survives partial filtering. */
export function lazy<T>(fn: () => T | Promise<T>): InertiaDeferredProp<T> {
  return { [INERTIA_DEFERRED]: 'lazy', fn }
}

/**
 * Optional prop: omitted on full visits; included on partial reloads only when requested
 * (`only` / Partial-Data).
 */
export function optional<T>(fn: () => T | Promise<T>): InertiaDeferredProp<T> {
  return { [INERTIA_DEFERRED]: 'optional', fn }
}

/** Always included, including on partial reloads when not in `only`. */
export function always<T>(fn: () => T | Promise<T>): InertiaDeferredProp<T> {
  return { [INERTIA_DEFERRED]: 'always', fn }
}

/**
 * Deferred props for [partial reloads](https://inertiajs.com/docs/v3/data-props/partial-reloads#lazy-data-evaluation).
 * Use `partial.lazy()`, `partial.optional()`, and `partial.always()` when building page props.
 */
export const partial = {
  lazy,
  optional,
  always,
} as const

export function isInertiaDeferred(value: unknown): value is InertiaDeferredProp {
  return isDeferredProp(value)
}

function deferredKind(value: unknown): InertiaDeferredKind | undefined {
  if (!isDeferredProp(value)) return undefined
  return value[INERTIA_DEFERRED]
}

/**
 * True when this request applies Partial-Data or Partial-Except for the current component.
 */
export function isFilteringPartialReload(
  req: InertiaRequestLike,
  component: string,
): boolean {
  const partialComponent = readHeader(req.headers, 'x-inertia-partial-component')
  if (!partialComponent || partialComponent !== component) return false
  const partialExceptRaw = readHeader(req.headers, 'x-inertia-partial-except')
  const partialDataRaw = readHeader(req.headers, 'x-inertia-partial-data')
  return (
    (partialExceptRaw !== undefined && partialExceptRaw !== '')
    || (partialDataRaw !== undefined && partialDataRaw !== '')
  )
}

async function awaitMaybe<T>(v: T | Promise<T>): Promise<T> {
  return await Promise.resolve(v)
}

async function resolveOne(value: unknown): Promise<unknown> {
  if (!isDeferredProp(value)) return value
  return await awaitMaybe(value.fn())
}

/**
 * Apply optional stripping, always merge, then resolve lazy/optional/always wrappers.
 */
export async function resolveDeferredProps(
  req: InertiaRequestLike,
  component: string,
  mergedProps: Record<string, unknown>,
  filtered: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const filteringPartial = isFilteringPartialReload(req, component)
  const out: Record<string, unknown> = { ...filtered }

  if (!filteringPartial) {
    for (const key of Object.keys(out)) {
      if (key === 'errors') continue
      if (deferredKind(out[key]) === 'optional') delete out[key]
    }
  }

  for (const [key, value] of Object.entries(mergedProps)) {
    if (key === 'errors') continue
    if (deferredKind(value) === 'always') out[key] = value
  }

  const resolved: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(out)) {
    if (key === 'errors') {
      resolved[key] = isDeferredProp(value) ? await resolveOne(value) : value
      continue
    }
    if (isDeferredProp(value)) {
      resolved[key] = await resolveOne(value)
    }
    else {
      resolved[key] = value
    }
  }

  return resolved
}
