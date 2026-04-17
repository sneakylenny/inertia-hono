<script setup>
import { Head } from '@inertiajs/vue3'
</script>

<template>
  <Head :title="$page.component" />
  <main class="min-h-screen p-6 md:p-10">
    <slot />
  </main>
</template>
