<script setup lang="ts">
import { computed } from 'vue'

export type LiveStatusState = 'connecting' | 'connected' | 'reconnecting' | 'unsupported'

const props = withDefaults(defineProps<{
  status: LiveStatusState
  text?: string
}>(), {
  text: 'Live sync via SSE keeps this list updated.',
})

const statusClass = computed(() => {
  switch (props.status) {
    case 'connected': return 'badge-success'
    case 'reconnecting': return 'badge-warning'
    case 'unsupported': return 'badge-error'
    default: return 'badge-neutral'
  }
})
</script>

<template>
  <div class="flex items-center gap-2 text-sm text-base-content/70">
    <span
      class="badge badge-outline"
      :class="statusClass"
    >{{ status }}</span>
    <span>{{ text }}</span>
  </div>
</template>
