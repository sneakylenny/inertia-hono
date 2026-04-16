<script setup lang="ts">
import { Head } from '@inertiajs/vue3'

defineProps<{
  appName?: string
  sharedViaMiddleware?: string
  sharedViaRouteHandler?: string
  fromRender?: string
}>()
</script>

<template>
  <Head title="Shared props" />
  <div class="container mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Shared props
    </h1>
    <p class="mt-4 max-w-2xl opacity-80">
      This page shows data from <kbd class="kbd kbd-sm">createInertia({ share })</kbd>, path
      middleware, <kbd class="kbd kbd-sm">share(c)</kbd> in the handler, and
      <kbd class="kbd kbd-sm">render(c, component, props)</kbd>.
    </p>
    <div class="mt-8 overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table">
        <tbody>
          <tr>
            <th class="w-1/3">
              <code>appName</code>
            </th>
            <td>{{ appName ?? '—' }}</td>
          </tr>
          <tr>
            <th>
              <code>sharedViaMiddleware</code>
            </th>
            <td>{{ sharedViaMiddleware ?? '—' }}</td>
          </tr>
          <tr>
            <th>
              <code>sharedViaRouteHandler</code>
            </th>
            <td>{{ sharedViaRouteHandler ?? '—' }}</td>
          </tr>
          <tr>
            <th>
              <code>fromRender</code>
            </th>
            <td>{{ fromRender ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
