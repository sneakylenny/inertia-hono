<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'
import { computed } from 'vue'

type Post = { id: number, title: string }
type Activity = { id: number, event: string }
type Notification = { id: number, text: string, unread: boolean }
type Settings = {
  theme?: string
  counters?: Record<string, number>
  prefs?: Record<string, unknown>
}
type Feed = { data: Post[], meta: { page: number, hasMore: boolean } }

const props = defineProps<{
  posts: Post[]
  activity: Activity[]
  notifications: Notification[]
  settings: Settings
  feed: Feed
  postsPage: number
  feedPage: number
  notifBatch: number
  settingsStep: number
  activityBefore: number
  debug: {
    postsRuns: number
    activityRuns: number
    notificationsRuns: number
    settingsRuns: number
    feedRuns: number
  }
}>()

const oldestActivityId = computed(() =>
  props.activity.length > 0 ? Math.min(...props.activity.map(item => item.id)) : 0,
)

const postsHasMore = computed(() => props.postsPage * 5 < 24)
const notifHasMore = computed(() => props.notifBatch < 3)
const settingsHasMore = computed(() => props.settingsStep < 3)

function reload(query: Record<string, string | number>, only: string[]) {
  router.get('/merge-demo', query, {
    only,
    preserveState: true,
    preserveScroll: true,
  })
}

function loadMorePosts() {
  reload({ postsPage: props.postsPage + 1 }, ['posts', 'postsPage'])
}

function loadOlderActivity() {
  reload({ activityBefore: oldestActivityId.value }, ['activity', 'activityBefore'])
}

function pushNotifications() {
  reload({ notifBatch: props.notifBatch + 1 }, ['notifications', 'notifBatch'])
}

function applySettingsPatch() {
  reload({ settingsStep: props.settingsStep + 1 }, ['settings', 'settingsStep'])
}

function loadMoreFeed() {
  reload({ feedPage: props.feedPage + 1 }, ['feed', 'feedPage'])
}

function fullVisit() {
  router.visit('/merge-demo')
}
</script>

<template>
  <Head title="Merge props" />
  <div class="container mx-auto max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Merge props (<kbd class="kbd kbd-sm">merge()</kbd> / <kbd class="kbd kbd-sm">deepMerge()</kbd>)
    </h1>
    <p class="mt-3 text-sm opacity-80">
      On a partial reload the client <strong>combines</strong> incoming props with what it
      already holds — arrays append (or prepend), objects merge, and
      <kbd class="kbd kbd-sm">.match('id')</kbd> updates existing rows instead of duplicating them.
      A full visit always replaces props.
    </p>

    <div class="mt-4 flex flex-wrap gap-2 text-xs">
      <span class="badge badge-outline">posts resolver: {{ debug.postsRuns }}×</span>
      <span class="badge badge-outline">activity resolver: {{ debug.activityRuns }}×</span>
      <span class="badge badge-outline">notifications resolver: {{ debug.notificationsRuns }}×</span>
      <span class="badge badge-outline">settings resolver: {{ debug.settingsRuns }}×</span>
      <span class="badge badge-outline">feed resolver: {{ debug.feedRuns }}×</span>
    </div>

    <section class="card mt-8 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h2 class="card-title text-base">
            Append — <kbd class="kbd kbd-sm">merge()</kbd>
          </h2>
          <span class="badge badge-primary badge-outline">{{ posts.length }} loaded</span>
        </div>
        <p class="text-sm opacity-70">
          Each partial reload fetches the next page and appends it to the list.
        </p>
        <ul class="mt-3 space-y-1 text-sm">
          <li
            v-for="post in posts"
            :key="post.id"
            class="rounded-box bg-base-200 px-3 py-1.5"
          >
            {{ post.title }}
          </li>
        </ul>
        <div class="card-actions mt-4">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="!postsHasMore"
            @click="loadMorePosts"
          >
            Load more (partial)
          </button>
        </div>
      </div>
    </section>

    <section class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h2 class="card-title text-base">
            Prepend — <kbd class="kbd kbd-sm">merge().prepend()</kbd>
          </h2>
          <span class="badge badge-secondary badge-outline">{{ activity.length }} events</span>
        </div>
        <p class="text-sm opacity-70">
          Older timeline entries are prepended above the list (oldest at top).
        </p>
        <ul class="mt-3 space-y-1 text-sm">
          <li
            v-for="item in activity"
            :key="item.id"
            class="rounded-box bg-base-200 px-3 py-1.5"
          >
            {{ item.event }}
          </li>
        </ul>
        <div class="card-actions mt-4">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            :disabled="oldestActivityId <= 1"
            @click="loadOlderActivity"
          >
            Load older (partial)
          </button>
        </div>
      </div>
    </section>

    <section class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h2 class="card-title text-base">
            Match — <kbd class="kbd kbd-sm">merge().match('id')</kbd>
          </h2>
          <span class="badge badge-accent badge-outline">{{ notifications.length }} rows</span>
        </div>
        <p class="text-sm opacity-70">
          Rows with the same <code>id</code> are updated in place; new ids are appended.
        </p>
        <ul class="mt-3 space-y-1 text-sm">
          <li
            v-for="note in notifications"
            :key="note.id"
            class="flex items-center gap-2 rounded-box px-3 py-1.5"
            :class="note.unread ? 'bg-accent/15' : 'bg-base-200'"
          >
            <span
              class="size-2 shrink-0 rounded-full"
              :class="note.unread ? 'bg-accent' : 'bg-base-content/20'"
            />
            <span>{{ note.text }}</span>
            <span class="ml-auto text-xs opacity-50">#{{ note.id }}</span>
          </li>
        </ul>
        <div class="card-actions mt-4">
          <button
            type="button"
            class="btn btn-accent btn-sm"
            :disabled="!notifHasMore"
            @click="pushNotifications"
          >
            Push update (partial)
          </button>
        </div>
      </div>
    </section>

    <section class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-base">
          Deep merge — <kbd class="kbd kbd-sm">deepMerge()</kbd>
        </h2>
        <p class="text-sm opacity-70">
          Nested objects are merged recursively instead of replaced at the top level.
        </p>
        <pre class="mt-3 overflow-x-auto rounded-box bg-base-200 p-3 text-xs">{{ JSON.stringify(settings, null, 2) }}</pre>
        <div class="card-actions mt-4">
          <button
            type="button"
            class="btn btn-outline btn-sm"
            :disabled="!settingsHasMore"
            @click="applySettingsPatch"
          >
            Apply patch (partial)
          </button>
        </div>
      </div>
    </section>

    <section class="card mt-4 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h2 class="card-title text-base">
            Nested path — <kbd class="kbd kbd-sm">merge().at('data')</kbd>
          </h2>
          <span class="badge badge-info badge-outline">{{ feed.data.length }} in feed.data</span>
        </div>
        <p class="text-sm opacity-70">
          Merge targets the nested <code>data</code> array inside a paginator-shaped object.
        </p>
        <ul class="mt-3 space-y-1 text-sm">
          <li
            v-for="row in feed.data"
            :key="row.id"
            class="rounded-box bg-base-200 px-3 py-1.5"
          >
            {{ row.title }}
          </li>
        </ul>
        <div class="card-actions mt-4">
          <button
            type="button"
            class="btn btn-info btn-sm"
            :disabled="!feed.meta.hasMore"
            @click="loadMoreFeed"
          >
            Load more into feed.data (partial)
          </button>
        </div>
      </div>
    </section>

    <div class="mt-8">
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="fullVisit"
      >
        Full visit (reset all props)
      </button>
    </div>
  </div>
</template>
