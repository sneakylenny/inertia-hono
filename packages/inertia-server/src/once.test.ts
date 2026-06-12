import { describe, expect, it } from 'vitest'
import { applyOnceProps, isInertiaOnceProp, once } from './once.js'
import { resolveInertia } from './resolve.js'

const fullVisit = { method: 'GET', url: '/', headers: {} as Record<string, string> }

describe('once builder', () => {
  it('marks a value as a once prop', () => {
    expect(isInertiaOnceProp(once(() => 1))).toBe(true)
    expect(isInertiaOnceProp(() => 1)).toBe(false)
    expect(isInertiaOnceProp({})).toBe(false)
  })

  it('chains immutably without mutating the original', () => {
    const base = once(() => 1)
    const chained = base.fresh().until(60).as('k').optional()
    expect(base.asKey).toBeUndefined()
    expect(base.isOptional).toBe(false)
    expect(chained.asKey).toBe('k')
    expect(chained.isOptional).toBe(true)
    expect(chained.expiry).toBe(60)
  })
})

describe('applyOnceProps', () => {
  it('resolves the value and records an entry on a full visit', async () => {
    let calls = 0
    const merged = {
      errors: {},
      roles: once(() => {
        calls++
        return ['admin']
      }),
    }
    const { props, onceProps } = await applyOnceProps(fullVisit, true, merged, merged)
    expect(calls).toBe(1)
    expect(props.roles).toEqual(['admin'])
    expect(onceProps).toEqual({ roles: { prop: 'roles' } })
  })

  it('skips resolving and omits the value when the client already holds it', async () => {
    let calls = 0
    const merged = {
      errors: {},
      roles: once(() => {
        calls++
        return ['admin']
      }),
    }
    const req = { method: 'GET', url: '/', headers: { 'X-Inertia-Except-Once-Props': 'roles' } }
    const { props, onceProps } = await applyOnceProps(req, true, merged, merged)
    expect(calls).toBe(0)
    expect('roles' in props).toBe(false)
    expect(onceProps).toEqual({ roles: { prop: 'roles' } })
  })

  it('uses the as() key as the cache key', async () => {
    const merged = {
      errors: {},
      memberRoles: once(() => ['admin']).as('roles'),
    }
    // Client holds it under "roles", not "memberRoles".
    const req = { method: 'GET', url: '/', headers: { 'X-Inertia-Except-Once-Props': 'roles' } }
    const { props, onceProps } = await applyOnceProps(req, true, merged, merged)
    expect('memberRoles' in props).toBe(false)
    expect(onceProps).toEqual({ roles: { prop: 'memberRoles' } })
  })

  it('emits an absolute expiresAt for until(seconds) and until(Date)', async () => {
    const before = Date.now()
    const merged = {
      errors: {},
      a: once(() => 1).until(60),
      b: once(() => 2).until(new Date(before + 120_000)),
    }
    const { onceProps } = await applyOnceProps(fullVisit, true, merged, merged)
    expect(onceProps?.a.expiresAt).toBeGreaterThanOrEqual(before + 60_000)
    expect(onceProps?.b.expiresAt).toBe(before + 120_000)
  })

  it('omits expiresAt for an until(Date) already in the past', async () => {
    const merged = {
      errors: {},
      a: once(() => 1).until(new Date(Date.now() - 1000)),
    }
    const { onceProps } = await applyOnceProps(fullVisit, true, merged, merged)
    expect(onceProps?.a.expiresAt).toBeUndefined()
  })

  it('forces a fresh value despite the except header when fresh() is set', async () => {
    let calls = 0
    const merged = {
      errors: {},
      roles: once(() => {
        calls++
        return ['admin']
      }).fresh(),
    }
    const req = { method: 'GET', url: '/', headers: { 'X-Inertia-Except-Once-Props': 'roles' } }
    const { props } = await applyOnceProps(req, true, merged, merged)
    expect(calls).toBe(1)
    expect(props.roles).toEqual(['admin'])
  })

  it('does not force fresh when fresh(false)', async () => {
    let calls = 0
    const merged = {
      errors: {},
      roles: once(() => {
        calls++
        return ['admin']
      }).fresh(false),
    }
    const req = { method: 'GET', url: '/', headers: { 'X-Inertia-Except-Once-Props': 'roles' } }
    const { props } = await applyOnceProps(req, true, merged, merged)
    expect(calls).toBe(0)
    expect('roles' in props).toBe(false)
  })

  it('forces a fresh value when the client resets the key', async () => {
    let calls = 0
    const merged = {
      errors: {},
      roles: once(() => {
        calls++
        return ['admin']
      }),
    }
    const req = {
      method: 'GET',
      url: '/',
      headers: { 'X-Inertia-Except-Once-Props': 'roles', 'X-Inertia-Reset': 'roles' },
    }
    const { props } = await applyOnceProps(req, true, merged, merged)
    expect(calls).toBe(1)
    expect(props.roles).toEqual(['admin'])
  })

  it('omits an optional once prop on a full visit without evaluating it', async () => {
    let calls = 0
    const merged = {
      errors: {},
      roles: once(() => {
        calls++
        return ['admin']
      }).optional(),
    }
    const { props, onceProps } = await applyOnceProps(fullVisit, true, merged, merged)
    expect(calls).toBe(0)
    expect('roles' in props).toBe(false)
    expect(onceProps).toBeUndefined()
  })

  it('returns undefined onceProps when there are none', async () => {
    const merged = { errors: {}, a: 1 }
    const { props, onceProps } = await applyOnceProps(fullVisit, true, merged, merged)
    expect(props).toEqual({ errors: {}, a: 1 })
    expect(onceProps).toBeUndefined()
  })
})

describe('resolveInertia with once props', () => {
  it('includes onceProps in the page object and resolves the value', async () => {
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/team',
        headers: { 'X-Inertia': 'true', 'X-Inertia-Version': 'v1' },
      },
      component: 'Team',
      props: { errors: {}, roles: once(() => ['admin', 'member']) },
      version: 'v1',
      locationUrl: 'https://example.com/team',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') return
    if (typeof result.body === 'string') throw new Error('expected json')
    expect(result.body.props.roles).toEqual(['admin', 'member'])
    expect(result.body.onceProps).toEqual({ roles: { prop: 'roles' } })
  })

  it('omits a cached once prop value on a follow-up request', async () => {
    let calls = 0
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/team',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
          'X-Inertia-Except-Once-Props': 'roles',
        },
      },
      component: 'Team',
      props: {
        errors: {},
        roles: once(() => {
          calls++
          return ['admin']
        }),
      },
      version: 'v1',
      locationUrl: 'https://example.com/team',
    })
    expect(calls).toBe(0)
    if (result.kind !== 'success') throw new Error('expected success')
    if (typeof result.body === 'string') throw new Error('expected json')
    expect('roles' in result.body.props).toBe(false)
    expect(result.body.onceProps).toEqual({ roles: { prop: 'roles' } })
  })

  it('only resolves a once prop on a partial reload when it is targeted', async () => {
    let calls = 0
    const props = {
      errors: {},
      events: [{ id: 1 }],
      roles: once(() => {
        calls++
        return ['admin']
      }),
    }
    // Partial reload targeting "events" only — the once prop is not requested.
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/events',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
          'X-Inertia-Partial-Component': 'Events',
          'X-Inertia-Partial-Data': 'events',
        },
      },
      component: 'Events',
      props,
      version: 'v1',
      locationUrl: 'https://example.com/events',
    })
    expect(calls).toBe(0)
    if (result.kind !== 'success') throw new Error('expected success')
    if (typeof result.body === 'string') throw new Error('expected json')
    expect('roles' in result.body.props).toBe(false)
  })
})
