<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { ref } from 'vue'

defineProps<{
  hint?: string
  appName?: string
}>()

const count = ref(0)
</script>

<template>
  <Head title="Home" />
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
  </div>
</template>
