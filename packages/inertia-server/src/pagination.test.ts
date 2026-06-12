import { describe, expect, it } from 'vitest'
import { cursorPaginate, offsetPaginate } from './pagination.js'

describe('offsetPaginate', () => {
  it('computes prev/next for a middle page', () => {
    expect(offsetPaginate({ page: 2, perPage: 10, total: 35 })).toEqual({
      pageName: 'page',
      currentPage: 2,
      previousPage: 1,
      nextPage: 3,
    })
  })

  it('has no previous on the first page', () => {
    expect(offsetPaginate({ page: 1, perPage: 10, total: 35 }).previousPage).toBeNull()
  })

  it('has no next on the last page', () => {
    expect(offsetPaginate({ page: 4, perPage: 10, total: 35 }).nextPage).toBeNull()
  })

  it('handles an empty result set and custom pageName', () => {
    expect(offsetPaginate({ page: 1, perPage: 10, total: 0, pageName: 'p' })).toEqual({
      pageName: 'p',
      currentPage: 1,
      previousPage: null,
      nextPage: null,
    })
  })
})

describe('cursorPaginate', () => {
  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }] // perPage + 1 (over-fetched)

  it('trims the surplus row and sets nextPage to the last kept cursor', () => {
    const { items, metadata } = cursorPaginate({
      items: rows,
      perPage: 2,
      getCursor: r => r.id,
    })
    expect(items).toEqual([{ id: 1 }, { id: 2 }])
    expect(metadata).toEqual({
      pageName: 'cursor',
      currentPage: null,
      previousPage: null,
      nextPage: 2,
    })
  })

  it('reports no next page when not over-fetched and exposes previous when paged', () => {
    const { items, metadata } = cursorPaginate({
      items: [{ id: 5 }, { id: 6 }],
      perPage: 2,
      getCursor: r => r.id,
      hasPrevious: true,
      currentCursor: 4,
    })
    expect(items).toHaveLength(2)
    expect(metadata.nextPage).toBeNull()
    expect(metadata.previousPage).toBe(5)
    expect(metadata.currentPage).toBe(4)
  })
})
