<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3'

defineProps<{
  section?: string
}>()
</script>

<template>
  <Head title="About" />
  <div class="container mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      About
    </h1>
    <p
      v-if="section"
      class="mt-4 opacity-80"
    >
      Section: {{ section }}
    </p>
    <Link
      class="btn btn-link px-0 mt-8"
      href="/"
    >
      Back home
    </Link>
  </div>
</template>
