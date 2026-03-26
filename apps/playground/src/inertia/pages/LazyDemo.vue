<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3'

defineProps<{
  appName?: string
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
  <div class="lazy-demo">
    <h1>Deferred props</h1>
    <p class="lead">
      This route uses <code>partial.lazy()</code>, <code>partial.optional()</code>, and
      <code>partial.always()</code> from <code>inertia-hono</code>. Open the server terminal and use the buttons below:
      resolver run counts go up only when that deferred prop is evaluated on the server.
    </p>

    <section
      v-if="lazyMain"
      class="card"
    >
      <h2>{{ lazyMain.label }}</h2>
      <p>{{ lazyMain.detail }}</p>
      <p class="meta">
        Server resolver runs: <strong>{{ lazyMain.resolverRuns }}</strong>
      </p>
    </section>

    <section
      v-if="optionalChunk"
      class="card optional"
    >
      <h2>{{ optionalChunk.label }}</h2>
      <p>{{ optionalChunk.detail }}</p>
      <p class="meta">
        Server resolver runs: <strong>{{ optionalChunk.resolverRuns }}</strong>
      </p>
    </section>

    <p
      v-else
      class="muted"
    >
      <code>optionalChunk</code> is not in props (expected on a full visit).
    </p>

    <section
      v-if="alwaysMeta"
      class="card always"
    >
      <h2>{{ alwaysMeta.label }}</h2>
      <p>{{ alwaysMeta.detail }}</p>
      <p class="meta">
        Server resolver runs: <strong>{{ alwaysMeta.resolverRuns }}</strong>
      </p>
    </section>

    <div class="actions">
      <button
        type="button"
        @click="visit({ only: ['lazyMain'] })"
      >
        Partial: only lazyMain
      </button>
      <button
        type="button"
        @click="visit({ only: ['optionalChunk'] })"
      >
        Partial: only optionalChunk
      </button>
      <button
        type="button"
        @click="visit({ only: ['lazyMain', 'optionalChunk'] })"
      >
        Partial: lazyMain + optionalChunk
      </button>
      <button
        type="button"
        @click="router.visit('/lazy-demo')"
      >
        Full visit
      </button>
    </div>

    <p
      v-if="appName"
      class="muted"
    >
      Shared <code>appName</code>: {{ appName }}
    </p>

    <nav>
      <Link href="/">
        Home
      </Link>
    </nav>
  </div>
</template>

<style scoped>
.lazy-demo {
  max-width: 44rem;
}

.lead {
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.card {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.card.optional {
  border-color: #a78bfa;
  background: color-mix(in srgb, #a78bfa 8%, transparent);
}

.card.always {
  border-color: #34d399;
  background: color-mix(in srgb, #34d399 8%, transparent);
}

.card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.meta {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
}

.muted {
  color: var(--muted, #6b7280);
  font-size: 0.9rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.actions button {
  cursor: pointer;
  padding: 0.35rem 0.65rem;
}

nav {
  margin-top: 1rem;
}
</style>
