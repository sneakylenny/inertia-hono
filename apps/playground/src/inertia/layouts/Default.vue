<script setup>
import { Link, usePage } from '@inertiajs/vue3'
import { ref, watch } from 'vue'
import DarkModeToggle from '../components/DarkModeToggle.vue'

const page = usePage()
const drawerToggle = ref(null)

watch(
  () => page.url,
  () => {
    const el = drawerToggle.value
    if (el && 'checked' in el) {
      el.checked = false
    }
  },
)
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input
      id="playground-nav-drawer"
      ref="drawerToggle"
      type="checkbox"
      class="drawer-toggle"
    >
    <div class="drawer-content flex min-h-dvh flex-col">
      <header
        class="navbar sticky top-0 z-30 min-h-14 border-b border-base-300 bg-base-100/90 px-2 backdrop-blur lg:hidden"
      >
        <label
          for="playground-nav-drawer"
          class="btn btn-square btn-ghost drawer-button"
          aria-label="Open navigation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </label>
        <div class="min-w-0 flex-1 px-2">
          <p class="truncate text-sm font-semibold text-base-content">
            Inertia Hono playground
          </p>
        </div>
        <DarkModeToggle />
      </header>
      <main class="min-h-0 min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <slot />
      </main>
    </div>
    <div class="drawer-side z-40">
      <label
        for="playground-nav-drawer"
        class="drawer-overlay"
        aria-label="Close navigation menu"
      />
      <aside
        class="flex min-h-full w-[min(100vw,16rem)] shrink-0 flex-col gap-4 border-r border-base-300 bg-base-200/95 p-4 lg:h-screen lg:sticky lg:top-0 lg:max-h-none lg:overflow-y-auto lg:bg-base-200/50"
      >
        <div class="flex items-center justify-between gap-2 px-2">
          <div class="text-sm font-semibold uppercase tracking-wide text-base-content/70">
            Demos
          </div>
          <span class="hidden lg:inline-flex">
            <DarkModeToggle />
          </span>
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
    </div>
  </div>
</template>
