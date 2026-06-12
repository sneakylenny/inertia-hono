import { Hono } from 'hono'
import {
  offsetPaginate,
  render,
  scroll,
  type InertiaVariables,
} from '@sneakylenny/inertia-hono'

const PER_PAGE = 15
const TOTAL = 200

/** Stable in-memory dataset — no database or ORM, just an array. */
const items = Array.from({ length: TOTAL }, (_, i) => {
  const id = i + 1
  return {
    id,
    title: `Item #${id}`,
    hue: (id * 37) % 360,
  }
})

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/scroll-demo', (c) => {
  const page = Math.max(1, Number(c.req.query('page') ?? '1') || 1)
  const start = (page - 1) * PER_PAGE
  const slice = items.slice(start, start + PER_PAGE)

  return render(c, 'ScrollDemo', {
    // `scroll()` appends/prepends the page based on the client's merge intent and
    // emits the pagination metadata `<InfiniteScroll>` needs. `offsetPaginate()`
    // derives prev/next from plain numbers — no ORM integration required.
    items: scroll(slice, offsetPaginate({ page, perPage: PER_PAGE, total: TOTAL })).match('id'),
    total: TOTAL,
    perPage: PER_PAGE,
  })
})

export default app
