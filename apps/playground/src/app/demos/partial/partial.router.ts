import { Hono } from 'hono'
import { partial, render, type InertiaVariables } from '@sneakylenny/inertia-hono'

/** Server-side counters — increment when each deferred resolver runs (check logs / UI). */
let lazyMainRuns = 0
let optionalChunkRuns = 0
let alwaysMetaRuns = 0

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/lazy-demo', c =>
  render(c, 'PartialDemo', {
    lazyMain: partial.lazy(() => {
      lazyMainRuns++
      return {
        resolverRuns: lazyMainRuns,
        label: 'lazy()',
        detail:
          'Evaluated only when this key is present after partial-reload filtering.',
      }
    }),
    optionalChunk: partial.optional(() => {
      optionalChunkRuns++
      return {
        resolverRuns: optionalChunkRuns,
        label: 'optional()',
        detail:
          'Omitted on full visits; included only when requested via only on a partial reload.',
      }
    }),
    alwaysMeta: partial.always(() => {
      alwaysMetaRuns++
      return {
        resolverRuns: alwaysMetaRuns,
        label: 'always()',
        detail:
          'Merged on every response, including narrow partial reloads.',
      }
    }),
  }),
)

export default app
