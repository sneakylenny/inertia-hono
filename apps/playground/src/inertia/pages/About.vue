<script setup lang="ts">
import { Link } from '@inertiajs/vue3'

defineProps<{
  section?: string
}>()
</script>

<template>
  <div>
    <h1>About</h1>
    <p v-if="section">Section: {{ section }}</p>
    <Link href="/">Back home</Link>
  </div>
</template>
