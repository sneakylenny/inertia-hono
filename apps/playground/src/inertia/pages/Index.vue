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
  <div>
    <p v-if="appName">{{ appName }}</p>
    <p v-if="hint" class="hint">{{ hint }}</p>
    <button type="button" @click="count++">Count is: {{ count }}</button>
    <nav>
      <Link href="/about">About</Link>
    </nav>
  </div>
</template>
