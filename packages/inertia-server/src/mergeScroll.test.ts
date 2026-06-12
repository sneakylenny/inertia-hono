import { describe, expect, it } from 'vitest'
import { deepMerge, merge } from './merge.js'
import { resolveInertia } from './resolve.js'
import { scroll } from './scroll.js'

const VERSION = 'v1'

function fullVisit(props: Record<string, unknown>) {
  return resolveInertia({
    request: {
      method: 'GET',
      url: '/feed',
      headers: { 'X-Inertia': 'true', 'X-Inertia-Version': VERSION },
    },
    component: 'Feed',
    props,
    version: VERSION,
    locationUrl: 'https://example.com/feed',
  })
}

function partialReload(
  props: Record<string, unknown>,
  only: string,
  extraHeaders: Record<string, string> = {},
) {
  return resolveInertia({
    request: {
      method: 'GET',
      url: '/feed?page=2',
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': VERSION,
        'X-Inertia-Partial-Component': 'Feed',
        'X-Inertia-Partial-Data': only,
        ...extraHeaders,
      },
    },
    component: 'Feed',
    props,
    version: VERSION,
    locationUrl: 'https://example.com/feed',
  })
}

function jsonBody(result: Awaited<ReturnType<typeof resolveInertia>>) {
  if (result.kind !== 'success' || result.format !== 'json') {
    throw new Error('expected json success')
  }
  return result.body
}

describe('merge props', () => {
  it('resolves the value but omits merge directives on a full visit', async () => {
    const page = jsonBody(await fullVisit({ posts: merge([1, 2, 3]) }))
    expect(page.props.posts).toEqual([1, 2, 3])
    expect(page.mergeProps).toBeUndefined()
    expect(page.prependProps).toBeUndefined()
  })

  it('emits mergeProps on a partial reload', async () => {
    const page = jsonBody(await partialReload({ posts: merge([4, 5]) }, 'posts'))
    expect(page.props.posts).toEqual([4, 5])
    expect(page.mergeProps).toEqual(['posts'])
  })

  it('supports prepend, deep merge, match, and nested path', async () => {
    const page = jsonBody(
      await partialReload(
        {
          posts: merge([1]).prepend().match('id'),
          tree: deepMerge({ a: 1 }),
          feed: merge({ data: [1] }).at('data').match(['uuid']),
        },
        'posts,tree,feed',
      ),
    )
    expect(page.prependProps).toEqual(['posts'])
    expect(page.deepMergeProps).toEqual(['tree'])
    expect(page.mergeProps).toEqual(['feed.data'])
    expect(page.matchPropsOn).toEqual(['posts.id', 'feed.data.uuid'])
  })

  it('accepts an async thunk and only evaluates surviving props', async () => {
    let evaluated = 0
    const page = jsonBody(
      await partialReload(
        {
          posts: merge(async () => {
            evaluated++
            return [9]
          }),
          other: merge(() => {
            evaluated++
            return [0]
          }),
        },
        'posts',
      ),
    )
    expect(page.props.posts).toEqual([9])
    expect(evaluated).toBe(1)
  })
})

describe('scroll props', () => {
  const meta = { pageName: 'page', currentPage: 1, previousPage: null, nextPage: 2 }

  it('always emits scrollProps, even on a full visit, without merge directives', async () => {
    const page = jsonBody(await fullVisit({ posts: scroll([1, 2], meta) }))
    expect(page.props.posts).toEqual([1, 2])
    expect(page.scrollProps).toEqual({ posts: { ...meta, reset: false } })
    expect(page.mergeProps).toBeUndefined()
  })

  it('appends by default on a load-more partial reload', async () => {
    const page = jsonBody(await partialReload({ posts: scroll([3, 4], meta) }, 'posts'))
    expect(page.mergeProps).toEqual(['posts'])
    expect(page.prependProps).toBeUndefined()
    expect(page.scrollProps?.posts).toMatchObject({ pageName: 'page', reset: false })
  })

  it('prepends when the client signals prepend intent', async () => {
    const page = jsonBody(
      await partialReload({ posts: scroll([0], meta) }, 'posts', {
        'X-Inertia-Infinite-Scroll-Merge-Intent': 'prepend',
      }),
    )
    expect(page.prependProps).toEqual(['posts'])
    expect(page.mergeProps).toBeUndefined()
  })

  it('emits matchPropsOn and a resolved reset flag', async () => {
    const page = jsonBody(
      await partialReload(
        { posts: scroll([1], meta).match('id').resetWhen(() => true) },
        'posts',
      ),
    )
    expect(page.matchPropsOn).toEqual(['posts.id'])
    expect(page.scrollProps?.posts.reset).toBe(true)
  })
})
