<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'

defineProps<{
  lazyMain?: {
    resolverRuns: number
    label: string
    detail: string
  }
  optionalChunk?: {
    resolverRuns: number
    label: string
    detail: string
  }
  alwaysMeta?: {
    resolverRuns: number
    label: string
    detail: string
  }
}>()

function visit(opts: { only?: string[] }) {
  router.get('/lazy-demo', {}, {
    only: opts.only,
    preserveState: true,
    preserveScroll: true,
  })
}
</script>

<template>
  <Head title="Partial reloads" />
  <div class="container mx-auto max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Deferred props
    </h1>
    <p class="mt-4 opacity-80">
      This route uses <kbd class="kbd kbd-sm">partial.lazy()</kbd>,
      <kbd class="kbd kbd-sm">partial.optional()</kbd>, and
      <kbd class="kbd kbd-sm">partial.always()</kbd> from
      <kbd class="kbd kbd-sm">inertia-hono</kbd>. Open the server terminal and use the buttons below:
      resolver run counts go up only when that deferred prop is evaluated on the server.
    </p>

    <div
      v-if="lazyMain"
      class="card mt-8 border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="card-body">
        <h2 class="card-title text-base">
          {{ lazyMain.label }}
        </h2>
        <p>{{ lazyMain.detail }}</p>
        <p class="text-sm opacity-70">
          Server resolver runs: <strong>{{ lazyMain.resolverRuns }}</strong>
        </p>
      </div>
    </div>

    <div
      v-if="optionalChunk"
      class="card mt-4 border-secondary bg-secondary/10 shadow-sm"
    >
      <div class="card-body">
        <h2 class="card-title text-base text-secondary">
          {{ optionalChunk.label }}
        </h2>
        <p class="text-secondary">
          {{ optionalChunk.detail }}
        </p>
        <p class="text-sm opacity-80">
          Server resolver runs: <strong>{{ optionalChunk.resolverRuns }}</strong>
        </p>
      </div>
    </div>

    <p
      v-else
      class="mt-4 text-sm opacity-70"
    >
      <kbd class="kbd kbd-sm">optionalChunk</kbd> is not in props (expected on a full visit).
    </p>

    <div
      v-if="alwaysMeta"
      class="card mt-4 border-success bg-success/10 shadow-sm"
    >
      <div class="card-body">
        <h2 class="card-title text-base text-success">
          {{ alwaysMeta.label }}
        </h2>
        <p class="text-success">
          {{ alwaysMeta.detail }}
        </p>
        <p class="text-sm opacity-80">
          Server resolver runs: <strong>{{ alwaysMeta.resolverRuns }}</strong>
        </p>
      </div>
    </div>

    <div class="mt-8 flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="visit({ only: ['lazyMain'] })"
      >
        Partial: only lazyMain
      </button>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="visit({ only: ['optionalChunk'] })"
      >
        Partial: only optionalChunk
      </button>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="visit({ only: ['lazyMain', 'optionalChunk'] })"
      >
        Partial: lazyMain + optionalChunk
      </button>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.visit('/lazy-demo')"
      >
        Full visit
      </button>
    </div>
  </div>
</template>
