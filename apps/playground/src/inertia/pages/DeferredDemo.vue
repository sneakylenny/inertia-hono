<script setup lang="ts">
import { Deferred, Link, router } from '@inertiajs/vue3'

defineProps<{
  intro?: string
  primaryData?: {
    resolverRuns: number
    title: string
    body: string
    items: string[]
  }
  secondaryData?: {
    resolverRuns: number
    title: string
    body: string
  }
  secondaryMore?: {
    resolverRuns: number
    title: string
    body: string
  }
}>()

function reloadAllDeferred() {
  router.get('/deferred-demo', {}, {
    only: ['primaryData', 'secondaryData', 'secondaryMore'],
    preserveState: true,
    preserveScroll: true,
  })
}

function reloadSecondaryOnly() {
  router.get('/deferred-demo', {}, {
    only: ['secondaryData', 'secondaryMore'],
    preserveState: true,
    preserveScroll: true,
  })
}
</script>

<template>
  <div class="container mx-auto max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Deferred props (<kbd class="kbd kbd-sm">defer()</kbd>)
    </h1>
    <p
      v-if="intro"
      class="mt-4 opacity-80"
    >
      {{ intro }}
    </p>

    <p class="mt-6 text-sm font-medium opacity-90">
      Immediate prop (no <kbd class="kbd kbd-sm">defer</kbd>)
    </p>
    <div class="card mt-2 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body py-4">
        <p class="text-sm">
          This section of the page renders immediately using data returned in the initial server response.
          However, not all props are loaded at once—some are "deferred" using Inertia's <kbd class="kbd kbd-sm">defer()</kbd> feature.
          Deferred props are fetched in follow-up background requests after the first render.
          You can observe this by opening DevTools → Network: you'll see extra Inertia requests fetching these deferred data chunks dynamically,
          resulting in a snappier initial page load while heavier data loads separately.
        </p>
      </div>
    </div>

    <p class="mt-8 text-sm font-medium opacity-90">
      Deferred: <kbd class="kbd kbd-sm">default</kbd> group
    </p>
    <Deferred data="primaryData">
      <template #fallback>
        <div class="card mt-2 border border-dashed border-primary/50 bg-primary/5">
          <div class="card-body">
            <span class="loading loading-dots loading-md text-primary" />
            <p class="mt-2 text-sm opacity-80">
              Loading <kbd class="kbd kbd-sm">primaryData</kbd> (default group)…
            </p>
          </div>
        </div>
      </template>

      <template #default="{ reloading }">
        <div
          v-if="primaryData"
          class="card mt-2 border border-primary bg-primary/10 shadow-sm transition-opacity"
          :class="{ 'opacity-50': reloading }"
        >
          <div class="card-body">
            <p
              v-if="reloading"
              class="mb-2 text-xs font-medium text-primary"
            >
              Reloading…
            </p>
            <h2 class="card-title text-base text-primary">
              {{ primaryData.title }}
            </h2>
            <p class="text-sm">
              {{ primaryData.body }}
            </p>
            <ul class="mt-3 list-inside list-disc text-sm opacity-90">
              <li
                v-for="(item, i) in primaryData.items"
                :key="i"
              >
                {{ item }}
              </li>
            </ul>
            <p class="mt-3 text-sm opacity-70">
              Server resolver runs: <strong>{{ primaryData.resolverRuns }}</strong>
            </p>
          </div>
        </div>
      </template>
    </Deferred>

    <p class="mt-8 text-sm font-medium opacity-90">
      Deferred: <kbd class="kbd kbd-sm">secondary</kbd> group (two props, one request)
    </p>
    <Deferred :data="['secondaryData', 'secondaryMore']">
      <template #fallback>
        <div class="card mt-2 border border-dashed border-secondary/50 bg-secondary/5">
          <div class="card-body">
            <span class="loading loading-dots loading-md text-secondary" />
            <p class="mt-2 text-sm opacity-80">
              Loading <kbd class="kbd kbd-sm">secondaryData</kbd> + <kbd class="kbd kbd-sm">secondaryMore</kbd>
              (same <code>secondary</code> group — one Inertia request for both)…
            </p>
          </div>
        </div>
      </template>

      <template #default="{ reloading }">
        <div
          v-if="secondaryData && secondaryMore"
          class="mt-2 flex flex-col gap-4 transition-opacity"
          :class="{ 'opacity-50': reloading }"
        >
          <p
            v-if="reloading"
            class="text-xs font-medium text-secondary"
          >
            Reloading…
          </p>
          <div class="card border border-secondary bg-secondary/10 shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-base text-secondary">
                {{ secondaryData.title }}
              </h2>
              <p class="text-sm text-secondary">
                {{ secondaryData.body }}
              </p>
              <p class="mt-3 text-sm opacity-70">
                Server resolver runs: <strong>{{ secondaryData.resolverRuns }}</strong>
              </p>
            </div>
          </div>
          <div class="card border border-secondary bg-secondary/10 shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-base text-secondary">
                {{ secondaryMore.title }}
              </h2>
              <p class="text-sm text-secondary">
                {{ secondaryMore.body }}
              </p>
              <p class="mt-3 text-sm opacity-70">
                Server resolver runs: <strong>{{ secondaryMore.resolverRuns }}</strong>
              </p>
            </div>
          </div>
        </div>
      </template>
    </Deferred>

    <div class="divider mt-10">
      Manual partial reload
    </div>
    <p class="text-sm opacity-80">
      Triggers the same <kbd class="kbd kbd-sm">only</kbd> visits Inertia uses for deferred props. While a visit is in flight, each <kbd class="kbd kbd-sm">Deferred</kbd> slot uses <code class="text-xs">reloading</code> to dim the cards (see <a
        class="link link-primary"
        href="https://inertiajs.com/docs/v3/data-props/deferred-props#reloading-indicator"
        target="_blank"
        rel="noreferrer"
      >reloading indicator</a>). Resolver run counts should increase.
    </p>
    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="reloadAllDeferred"
      >
        Reload all deferred props
      </button>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="reloadSecondaryOnly"
      >
        Reload secondary group only
      </button>
    </div>

    <nav class="mt-10">
      <Link
        class="btn btn-link px-0"
        href="/"
      >
        Home
      </Link>
    </nav>
  </div>
</template>
