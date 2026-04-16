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
      class="mt-4 text-lg text-base-content/70"
    >
      {{ greeting }}
    </p>
    <div class="mt-8">
      <p class="text-sm text-base-content/50">
        Edit <code class="badge badge-ghost">src/inertia/pages/Home.vue</code> to get started.
      </p>
    </div>
  </div>
</template>
