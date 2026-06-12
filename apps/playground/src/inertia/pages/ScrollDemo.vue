<script setup lang="ts">
import { Head, InfiniteScroll, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

type Item = { id: number, title: string, hue: number }

defineProps<{
  items: Item[]
  total: number
  perPage: number
}>()

const page = usePage()
const loaded = computed(() => (page.props.items as Item[]).length)
</script>

<template>
  <Head title="Infinite scroll" />
  <div class="container mx-auto max-w-xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Infinite scroll (<kbd class="kbd kbd-sm">scroll()</kbd>)
    </h1>
    <p class="mt-3 text-sm opacity-80">
      The server returns one page at a time with
      <kbd class="kbd kbd-sm">scroll(items, offsetPaginate(...))</kbd>. As you reach the
      bottom, <kbd class="kbd kbd-sm">&lt;InfiniteScroll&gt;</kbd> sends a partial reload and
      the new page is <strong>merged</strong> onto the list instead of replacing it — no
      ORM or <kbd class="kbd kbd-sm">Model::paginate()</kbd> required.
    </p>

    <div class="mt-4 flex items-center gap-2 text-sm">
      <span class="badge badge-primary badge-outline">{{ loaded }} / {{ total }} loaded</span>
      <span class="opacity-60">{{ perPage }} per page</span>
    </div>

    <InfiniteScroll
      data="items"
      :buffer="200"
      class="mt-6 flex flex-col gap-2"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="card border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="card-body flex-row items-center gap-3 p-3">
          <span
            class="inline-block size-8 shrink-0 rounded-full"
            :style="{ backgroundColor: `hsl(${item.hue} 70% 55%)` }"
          />
          <span class="font-medium">{{ item.title }}</span>
          <span class="ml-auto text-xs opacity-50">id {{ item.id }}</span>
        </div>
      </div>

      <template #loading>
        <div class="flex justify-center py-4">
          <span class="loading loading-dots loading-md text-primary" />
        </div>
      </template>
    </InfiniteScroll>
  </div>
</template>
