import { Hono } from 'hono'
import {
  deepMerge,
  merge,
  partial,
  render,
  type InertiaVariables,
} from '@sneakylenny/inertia-hono'

const POSTS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  title: `Post #${i + 1}`,
}))

const ACTIVITY = Array.from({ length: 18 }, (_, i) => {
  const id = 18 - i
  return { id, event: `Event #${id}` }
})

const NOTIF_UPDATES = [
  [
    { id: 1, text: 'Welcome!', unread: true },
    { id: 2, text: 'New comment on your post', unread: true },
  ],
  [
    { id: 1, text: 'Welcome! (marked read)', unread: false },
    { id: 3, text: 'You were mentioned', unread: true },
  ],
  [
    { id: 2, text: 'New comment on your post (updated)', unread: false },
    { id: 4, text: 'Deploy finished', unread: true },
  ],
]

const SETTINGS_PATCHES = [
  { theme: 'light', counters: { views: 10 }, prefs: { notify: true, digest: 'daily' } },
  { theme: 'dark', counters: { clicks: 3 }, prefs: { digest: 'weekly' } },
  { counters: { views: 12, shares: 1 }, prefs: { notify: false } },
]

let postsRuns = 0
let activityRuns = 0
let notificationsRuns = 0
let settingsRuns = 0
let feedRuns = 0

function postsSlice(page: number, perPage: number) {
  const start = (page - 1) * perPage
  return POSTS.slice(start, start + perPage)
}

function activityBefore(beforeId: number, count: number) {
  const idx = ACTIVITY.findIndex(item => item.id === beforeId)
  if (idx <= 0) return []
  return ACTIVITY.slice(Math.max(0, idx - count), idx)
}

function readInt(query: string | undefined, fallback: number) {
  const n = Number(query ?? String(fallback))
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/merge-demo', (c) => {
  const postsPage = readInt(c.req.query('postsPage'), 1)
  const feedPage = readInt(c.req.query('feedPage'), 1)
  const notifBatch = Math.min(readInt(c.req.query('notifBatch'), 1), NOTIF_UPDATES.length)
  const settingsStep = Math.min(readInt(c.req.query('settingsStep'), 1), SETTINGS_PATCHES.length)
  const activityBeforeId = readInt(c.req.query('activityBefore'), 0)

  return render(c, 'MergeDemo', {
    postsPage,
    feedPage,
    notifBatch,
    settingsStep,
    activityBefore: activityBeforeId,

    posts: merge(() => {
      postsRuns++
      return postsSlice(postsPage, 5)
    }).match('id'),

    activity: merge(() => {
      activityRuns++
      if (activityBeforeId > 0) return activityBefore(activityBeforeId, 3)
      return ACTIVITY.slice(0, 4)
    }).prepend().match('id'),

    notifications: merge(() => {
      notificationsRuns++
      return NOTIF_UPDATES[notifBatch - 1]!
    }).match('id'),

    settings: deepMerge(() => {
      settingsRuns++
      return SETTINGS_PATCHES[settingsStep - 1]!
    }),

    feed: merge(() => {
      feedRuns++
      const perPage = 4
      const data = postsSlice(feedPage, perPage)
      return {
        data,
        meta: { page: feedPage, hasMore: feedPage * perPage < POSTS.length },
      }
    }).at('data').match('id'),

    debug: partial.always(() => ({
      postsRuns,
      activityRuns,
      notificationsRuns,
      settingsRuns,
      feedRuns,
    })),
  })
})

export default app
