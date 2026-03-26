<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { ref } from 'vue'

defineProps<{
  hint?: string
  appName?: string
}>()

const count = ref(0)
</script>

<template>
  <div class="container mx-auto max-w-3xl px-4 py-10">
    <p
      v-if="appName"
      class="text-sm opacity-60"
    >
      {{ appName }}
    </p>
    <div
      v-if="hint"
      role="alert"
      class="alert alert-warning mt-2"
    >
      <span>{{ hint }}</span>
    </div>
    <div class="mt-8">
      <button
        type="button"
        class="btn btn-neutral"
        @click="count++"
      >
        Count is: {{ count }}
      </button>
    </div>
    <div class="divider mt-10">
      Demos
    </div>
    <nav class="flex flex-wrap gap-2">
      <Link
        class="btn btn-ghost btn-sm"
        href="/"
      >
        Home
      </Link>
      <Link
        class="btn btn-ghost btn-sm"
        href="/about"
      >
        About
      </Link>
      <Link
        class="btn btn-ghost btn-sm"
        href="/todos"
      >
        Todos
      </Link>
      <Link
        class="btn btn-ghost btn-sm"
        href="/shared-demo"
      >
        Shared props demo
      </Link>
      <Link
        class="btn btn-ghost btn-sm"
        href="/lazy-demo"
      >
        Partial reloads (lazy / optional / always)
      </Link>
      <Link
        class="btn btn-ghost btn-sm"
        href="/deferred-demo"
      >
        Deferred props (defer + Deferred)
      </Link>
    </nav>
  </div>
</template>
