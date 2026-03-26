import { describe, expect, it } from 'vitest'
import {
  isFilteringPartialReload,
  isInertiaDeferred,
  partial,
  resolveDeferredProps,
} from './deferred.js'

describe('isFilteringPartialReload', () => {
  it('is false without partial component', () => {
    expect(
      isFilteringPartialReload(
        { method: 'GET', url: '/', headers: {} },
        'Page',
      ),
    ).toBe(false)
  })

  it('is false when partial component mismatches', () => {
    expect(
      isFilteringPartialReload(
        {
          method: 'GET',
          url: '/',
          headers: { 'X-Inertia-Partial-Component': 'Other', 'X-Inertia-Partial-Data': 'a' },
        },
        'Page',
      ),
    ).toBe(false)
  })

  it('is false when partial component matches but no data/except', () => {
    expect(
      isFilteringPartialReload(
        {
          method: 'GET',
          url: '/',
          headers: { 'X-Inertia-Partial-Component': 'Page' },
        },
        'Page',
      ),
    ).toBe(false)
  })

  it('is true with Partial-Data', () => {
    expect(
      isFilteringPartialReload(
        {
          method: 'GET',
          url: '/',
          headers: {
            'X-Inertia-Partial-Component': 'Page',
            'X-Inertia-Partial-Data': 'users',
          },
        },
        'Page',
      ),
    ).toBe(true)
  })

  it('is true with Partial-Except', () => {
    expect(
      isFilteringPartialReload(
        {
          method: 'GET',
          url: '/',
          headers: {
            'X-Inertia-Partial-Component': 'Page',
            'X-Inertia-Partial-Except': 'auth',
          },
        },
        'Page',
      ),
    ).toBe(true)
  })
})

describe('resolveDeferredProps', () => {
  it('strips optional keys on full visit without evaluating them', async () => {
    let optCalls = 0
    const merged = {
      errors: {},
      users: partial.lazy(() => [1]),
      extra: partial.optional(() => {
        optCalls++
        return 'x'
      }),
    }
    const filtered = merged
    const out = await resolveDeferredProps(
      { method: 'GET', url: '/', headers: {} },
      'Page',
      merged,
      filtered,
    )
    expect(optCalls).toBe(0)
    expect(out.extra).toBeUndefined()
    expect(out.users).toEqual([1])
  })
})

describe('isInertiaDeferred', () => {
  it('recognizes lazy/optional/always', () => {
    expect(isInertiaDeferred(partial.lazy(() => 1))).toBe(true)
    expect(isInertiaDeferred(partial.optional(() => 1))).toBe(true)
    expect(isInertiaDeferred(partial.always(() => 1))).toBe(true)
    expect(isInertiaDeferred({})).toBe(false)
    expect(isInertiaDeferred(() => 1)).toBe(false)
  })
})
