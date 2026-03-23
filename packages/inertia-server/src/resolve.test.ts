import { describe, expect, it } from 'vitest'
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
})
