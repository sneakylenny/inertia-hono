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
      class="alert mt-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="stroke-info h-6 w-6 shrink-0"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
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
