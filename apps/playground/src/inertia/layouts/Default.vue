<script setup>
import { Link } from '@inertiajs/vue3'
</script>

<template>
  <div class="flex min-h-screen">
    <aside
      class="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-base-300 bg-base-200/50 p-4"
    >
      <div class="px-2 text-sm font-semibold uppercase tracking-wide text-base-content/70">
        Demos
      </div>
      <nav class="flex-1">
        <ul class="menu menu-vertical w-full rounded-box bg-base-200 p-2">
          <li>
            <Link
              href="/"
              :class="{ 'menu-active': $page.url === '/' }"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              :class="{ 'menu-active': $page.url === '/about' }"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              href="/todos"
              :class="{ 'menu-active': $page.url === '/todos' }"
            >
              Todos
            </Link>
          </li>
          <li>
            <Link
              href="/shared-demo"
              :class="{ 'menu-active': $page.url === '/shared-demo' }"
            >
              Shared props demo
            </Link>
          </li>
          <li>
            <Link
              href="/lazy-demo"
              :class="{ 'menu-active': $page.url === '/lazy-demo' }"
            >
              Partial reloads (lazy / optional / always)
            </Link>
          </li>
          <li>
            <Link
              href="/deferred-demo"
              :class="{ 'menu-active': $page.url === '/deferred-demo' }"
            >
              Deferred props (defer + Deferred)
            </Link>
          </li>
          <li>
            <Link
              href="/redirect-demo"
              :class="{ 'menu-active': $page.url === '/redirect-internal-test' }"
            >
              Redirect demo
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
    <main class="min-w-0 flex-1 p-6 md:p-8">
      <slot />
    </main>
  </div>
</template>
