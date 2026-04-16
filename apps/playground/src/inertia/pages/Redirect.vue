<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3'
</script>

<template>
  <Head title="Redirect demo" />
  <div class="container mx-auto max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Redirect
    </h1>
    <p class="mt-4 opacity-80">
      This page is used to test the redirect functionality.
    </p>
    <div class="mt-8 flex flex-col gap-2">
      <Link
        class="btn btn-outline px-0"
        href="/redirect-internal-test"
      >
        Redirect internal test
      </Link>
      <Link
        class="btn btn-outline px-0"
        href="/redirect-external-test"
      >
        Redirect external test
      </Link>
    </div>

    <div class="mt-8">
      <Link
        class="btn btn-link px-0"
        href="/"
      >
        Back home
      </Link>
    </div>
  </div>
</template>
