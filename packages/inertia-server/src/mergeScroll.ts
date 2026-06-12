import { isFilteringPartialReload } from './deferred.js'
import { readHeader } from './headers.js'
import { isInertiaMergeProp, type InertiaMergeProp } from './merge.js'
import {
  INERTIA_MERGE_INTENT_HEADER,
  isInertiaScrollProp,
  type InertiaScrollProp,
  type InertiaScrollPropMeta,
} from './scroll.js'
import type { InertiaRequestLike } from './types.js'

async function awaitMaybe<T>(v: T | Promise<T>): Promise<T> {
  return await Promise.resolve(v)
}

async function resolveReset(
  condition: boolean | (() => boolean | Promise<boolean>),
): Promise<boolean> {
  if (condition === false) return false
  if (condition === true) return true
  return await awaitMaybe(condition())
}

/** Page-object fields produced by resolving {@link merge}/{@link scroll} props. */
export type MergeScrollResult = {
  props: Record<string, unknown>
  mergeProps?: string[]
  prependProps?: string[]
  deepMergeProps?: string[]
  matchPropsOn?: string[]
  scrollProps?: Record<string, InertiaScrollPropMeta>
}

/**
 * Unwrap {@link merge} and {@link scroll} props, recording the page-object fields
 * (`mergeProps`, `prependProps`, `deepMergeProps`, `matchPropsOn`, `scrollProps`)
 * the client uses to combine responses.
 *
 * Merge directives are only emitted on [partial reloads](https://inertiajs.com/docs/v3/core-concepts/the-protocol#partial-reloads);
 * on full visits the prop is replaced as usual. `scrollProps` is always emitted so
 * the client can initialise its pagination state on first paint.
 */
export async function applyMergeAndScroll(
  request: InertiaRequestLike,
  component: string,
  props: Record<string, unknown>,
): Promise<MergeScrollResult> {
  const out: Record<string, unknown> = { ...props }
  const mergeProps: string[] = []
  const prependProps: string[] = []
  const deepMergeProps: string[] = []
  const matchPropsOn: string[] = []
  const scrollProps: Record<string, InertiaScrollPropMeta> = {}

  const emitMerge = isFilteringPartialReload(request, component)
  const mergeIntent = readHeader(request.headers, INERTIA_MERGE_INTENT_HEADER)

  const addMatchOn = (path: string, fields: readonly string[]) => {
    for (const field of fields) matchPropsOn.push(`${path}.${field}`)
  }

  for (const [key, val] of Object.entries(props)) {
    if (key === 'errors') continue

    if (isInertiaMergeProp(val)) {
      const merge = val as InertiaMergeProp
      out[key] = await awaitMaybe(merge.fn())
      if (emitMerge) {
        const path = merge.atPath ? `${key}.${merge.atPath}` : key
        if (merge.prependMode) prependProps.push(path)
        else if (merge.strategy === 'deep') deepMergeProps.push(path)
        else mergeProps.push(path)
        addMatchOn(path, merge.matchOnFields)
      }
      continue
    }

    if (isInertiaScrollProp(val)) {
      const scroll = val as InertiaScrollProp
      out[key] = await awaitMaybe(scroll.fn())
      const reset = await resolveReset(scroll.resetCondition)
      scrollProps[key] = { ...scroll.metadata, reset }
      if (emitMerge) {
        // Loading a previous page prepends; anything else (next page) appends.
        if (mergeIntent === 'prepend') prependProps.push(key)
        else mergeProps.push(key)
        addMatchOn(key, scroll.matchOnFields)
      }
    }
  }

  return {
    props: out,
    mergeProps: mergeProps.length > 0 ? mergeProps : undefined,
    prependProps: prependProps.length > 0 ? prependProps : undefined,
    deepMergeProps: deepMergeProps.length > 0 ? deepMergeProps : undefined,
    matchPropsOn: matchPropsOn.length > 0 ? matchPropsOn : undefined,
    scrollProps: Object.keys(scrollProps).length > 0 ? scrollProps : undefined,
  }
}
