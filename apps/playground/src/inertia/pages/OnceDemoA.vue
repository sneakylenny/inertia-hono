<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3'

defineProps<{
  config: { runs: number, resolvedOn: string }
  configFromCache: boolean
}>()

function forceRefresh() {
  router.reload({ reset: ['config'] })
}
</script>

<template>
  <Head title="Once Props — Page A" />
  <div class="container mx-auto max-w-xl px-4 py-10">
    <div
      role="tablist"
      class="tabs tabs-boxed mb-6 w-fit"
    >
      <span
        role="tab"
        class="tab tab-active"
      >Page A</span>
      <Link
        role="tab"
        href="/once-demo/b"
        class="tab"
      >
        Page B
      </Link>
    </div>

    <h1 class="text-2xl font-bold">
      Once props (<kbd class="kbd kbd-sm">once()</kbd>)
    </h1>
    <p class="mt-3 text-sm opacity-80">
      Both pages define the same <kbd class="kbd kbd-sm">config</kbd> prop using <kbd class="kbd kbd-sm">once()</kbd>.
      The server resolves the callback on the first visit and the client caches the result.
      Navigate to Page B — its resolver is skipped entirely.
      The cache status badge is demo-only; real apps just wrap the prop in <kbd class="kbd kbd-sm">once()</kbd>.
    </p>

    <div class="card mt-6 border border-primary bg-primary/10 shadow-sm">
      <div class="card-body">
        <div class="flex items-start justify-between gap-2">
          <h2 class="card-title text-base text-primary">
            config
          </h2>
          <span class="badge badge-primary badge-outline badge-sm shrink-0">once()</span>
        </div>
        <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="opacity-60">
            Resolver ran
          </dt>
          <dd><strong>{{ config.runs }}×</strong></dd>
          <dt class="opacity-60">
            Last resolved on
          </dt>
          <dd>
            <strong>{{ config.resolvedOn }}</strong>
          </dd>
          <dt class="opacity-60">
            Cache status
          </dt>
          <dd>
            <span
              class="badge badge-sm"
              :class="configFromCache ? 'badge-success' : 'badge-warning'"
            >
              {{ configFromCache ? 'hit — resolver skipped' : 'miss — resolved here' }}
            </span>
          </dd>
        </dl>
        <div class="card-actions mt-4">
          <button
            type="button"
            class="btn btn-outline btn-primary btn-sm"
            @click="forceRefresh"
          >
            Force refresh
          </button>
        </div>
      </div>
    </div>

    <div class="divider mt-8">
      How to observe the caching
    </div>
    <ol class="list-inside list-decimal space-y-2 text-sm opacity-80">
      <li>
        Note <strong>resolver ran: 1×</strong>, last resolved on: <em>Page A</em>, cache: <em>miss</em>.
      </li>
      <li>
        Click <strong>Page B</strong> above. The count stays at 1, "last resolved on"
        still says <em>Page A</em>, and cache shows <em>hit</em> — Page B's resolver was never called.
      </li>
      <li>
        Click <strong>Force refresh</strong> on either page. The count increments and
        "last resolved on" changes to that page.
      </li>
      <li>
        Navigate to the other page — it shows the updated value immediately,
        because both pages share the same cache.
      </li>
    </ol>
  </div>
</template>
