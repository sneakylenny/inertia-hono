<script setup lang="ts">
defineProps<{
  greeting?: string
}>()
</script>

<template>
  <div class="container mx-auto max-w-2xl py-10">
    <h1 class="text-4xl font-bold">
      Inertia + Hono
    </h1>
    <p
      v-if="greeting"
      class="mt-4 text-lg text-neutral-600 dark:text-neutral-400"
    >
      {{ greeting }}
    </p>
    <div class="mt-8">
      <p class="text-sm text-neutral-500 dark:text-neutral-500">
        Edit
        <code class="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">src/inertia/pages/Home.vue</code>
        to get started.
      </p>
    </div>
  </div>
</template>
