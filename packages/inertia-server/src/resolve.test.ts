import { describe, expect, it } from 'vitest'
import { partial } from './deferred.js'
import { resolveInertia } from './resolve.js'

describe('resolveInertia', () => {
  it('returns HTML with embedded page JSON for first visit', async () => {
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/events/80',
        headers: { Accept: 'text/html' },
      },
      component: 'Event',
      props: { errors: {}, event: { id: 80 } },
      version: 'v1',
      locationUrl: 'https://example.com/events/80',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') return
    expect(result.headers['Content-Type']).toMatch(/text\/html/)
    expect(typeof result.body).toBe('string')
    const html = result.body as string
    expect(html).toContain('data-page="app"')
    expect(html).toContain('type="application/json"')
    expect(html).toContain('"component":"Event"')
    expect(html).toContain('id="app"')
  })

  it('returns JSON with Inertia headers for X-Inertia requests', async () => {
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/events/80',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
        },
      },
      component: 'Event',
      props: { errors: {}, event: { id: 80 } },
      version: 'v1',
      locationUrl: 'https://example.com/events/80',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') return
    expect(result.format).toBe('json')
    if (result.format !== 'json') return
    expect(result.headers['Content-Type']).toMatch(/application\/json/)
    expect(result.headers['X-Inertia']).toBe('true')
    expect(result.headers.Vary).toBe('X-Inertia')
    expect(result.body).toMatchObject({
      component: 'Event',
      url: '/events/80',
      version: 'v1',
    })
  })

  it('returns 409 with X-Inertia-Location on GET version mismatch', async () => {
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/events/80',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'old',
        },
      },
      component: 'Event',
      props: { errors: {} },
      version: 'new',
      locationUrl: 'https://example.com/events/80',
    })
    expect(result).toEqual({
      kind: 'version-mismatch',
      status: 409,
      headers: { 'X-Inertia-Location': 'https://example.com/events/80' },
    })
  })

  it('does not 409 on version mismatch for non-GET', async () => {
    const result = await resolveInertia({
      request: {
        method: 'POST',
        url: '/events',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'old',
        },
      },
      component: 'Event',
      props: { errors: {} },
      version: 'new',
      locationUrl: 'https://example.com/events',
    })
    expect(result.kind).toBe('success')
  })

  it('filters props on partial reload when component matches', async () => {
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
      props: {
        errors: {},
        auth: { id: 1 },
        categories: [],
        events: [{ id: 1 }],
      },
      version: 'v1',
      locationUrl: 'https://example.com/events',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') return
    if (typeof result.body === 'string') throw new Error('expected json')
    expect(result.body.props).toEqual({
      errors: {},
      events: [{ id: 1 }],
    })
  })

  it('Partial-Except takes precedence over Partial-Data', async () => {
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/events',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
          'X-Inertia-Partial-Component': 'Events',
          'X-Inertia-Partial-Data': 'events',
          'X-Inertia-Partial-Except': 'auth,categories',
        },
      },
      component: 'Events',
      props: {
        errors: {},
        auth: { id: 1 },
        categories: [],
        events: [{ id: 1 }],
      },
      version: 'v1',
      locationUrl: 'https://example.com/events',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success') return
    if (typeof result.body === 'string') throw new Error('expected json')
    expect(result.body.props).toEqual({
      errors: {},
      events: [{ id: 1 }],
    })
  })

  it('resolves lazy props on full Inertia visit', async () => {
    let usersCalls = 0
    let companiesCalls = 0
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/users',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
        },
      },
      component: 'Users',
      props: {
        errors: {},
        users: partial.lazy(() => {
          usersCalls++
          return [1]
        }),
        companies: partial.lazy(() => {
          companiesCalls++
          return [2]
        }),
      },
      version: 'v1',
      locationUrl: 'https://example.com/users',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success' || result.format !== 'json') return
    expect(usersCalls).toBe(1)
    expect(companiesCalls).toBe(1)
    expect(result.body.props).toEqual({
      errors: {},
      users: [1],
      companies: [2],
    })
  })

  it('evaluates only lazy props included in partial reload', async () => {
    let usersCalls = 0
    let companiesCalls = 0
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/users',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
          'X-Inertia-Partial-Component': 'Users',
          'X-Inertia-Partial-Data': 'users',
        },
      },
      component: 'Users',
      props: {
        errors: {},
        users: partial.lazy(() => {
          usersCalls++
          return [1]
        }),
        companies: partial.lazy(() => {
          companiesCalls++
          return [2]
        }),
      },
      version: 'v1',
      locationUrl: 'https://example.com/users',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success' || result.format !== 'json') return
    expect(usersCalls).toBe(1)
    expect(companiesCalls).toBe(0)
    expect(result.body.props).toEqual({
      errors: {},
      users: [1],
    })
  })

  it('omits optional props on full visit without running their resolvers', async () => {
    let sidebarCalls = 0
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/users',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
        },
      },
      component: 'Users',
      props: {
        errors: {},
        users: partial.lazy(() => [1]),
        sidebar: partial.optional(() => {
          sidebarCalls++
          return 'side'
        }),
      },
      version: 'v1',
      locationUrl: 'https://example.com/users',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success' || result.format !== 'json') return
    expect(sidebarCalls).toBe(0)
    expect(result.body.props).toEqual({
      errors: {},
      users: [1],
    })
  })

  it('includes optional prop when requested on partial reload', async () => {
    let sidebarCalls = 0
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/users',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
          'X-Inertia-Partial-Component': 'Users',
          'X-Inertia-Partial-Data': 'sidebar',
        },
      },
      component: 'Users',
      props: {
        errors: {},
        sidebar: partial.optional(() => {
          sidebarCalls++
          return 'ok'
        }),
      },
      version: 'v1',
      locationUrl: 'https://example.com/users',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success' || result.format !== 'json') return
    expect(sidebarCalls).toBe(1)
    expect(result.body.props).toEqual({
      errors: {},
      sidebar: 'ok',
    })
  })

  it('merges always props on partial reload', async () => {
    let authCalls = 0
    let usersCalls = 0
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/users',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
          'X-Inertia-Partial-Component': 'Users',
          'X-Inertia-Partial-Data': 'users',
        },
      },
      component: 'Users',
      props: {
        errors: {},
        auth: partial.always(() => {
          authCalls++
          return { id: 1 }
        }),
        users: partial.lazy(() => {
          usersCalls++
          return [9]
        }),
      },
      version: 'v1',
      locationUrl: 'https://example.com/users',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success' || result.format !== 'json') return
    expect(authCalls).toBe(1)
    expect(usersCalls).toBe(1)
    expect(result.body.props).toEqual({
      errors: {},
      auth: { id: 1 },
      users: [9],
    })
  })

  it('resolves async lazy props', async () => {
    const result = await resolveInertia({
      request: {
        method: 'GET',
        url: '/users',
        headers: {
          'X-Inertia': 'true',
          'X-Inertia-Version': 'v1',
        },
      },
      component: 'Users',
      props: {
        errors: {},
        users: partial.lazy(async () => [1, 2]),
      },
      version: 'v1',
      locationUrl: 'https://example.com/users',
    })
    expect(result.kind).toBe('success')
    if (result.kind !== 'success' || result.format !== 'json') return
    expect(result.body.props.users).toEqual([1, 2])
  })
})
