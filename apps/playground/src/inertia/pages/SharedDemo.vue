<script setup lang="ts">
import { Link } from '@inertiajs/vue3'

defineProps<{
  appName?: string
  sharedViaMiddleware?: string
  sharedViaRouteHandler?: string
  fromRender?: string
}>()
</script>

<template>
  <div class="shared-demo">
    <h1>Shared props</h1>
    <p class="lead">
      This page shows data from <code>createInertia({ share })</code>, path
      middleware, <code>share(c)</code> in the handler, and
      <code>render(c, component, props)</code>.
    </p>
    <dl>
      <dt><code>appName</code></dt>
      <dd>{{ appName ?? '—' }}</dd>
      <dt><code>sharedViaMiddleware</code></dt>
      <dd>{{ sharedViaMiddleware ?? '—' }}</dd>
      <dt><code>sharedViaRouteHandler</code></dt>
      <dd>{{ sharedViaRouteHandler ?? '—' }}</dd>
      <dt><code>fromRender</code></dt>
      <dd>{{ fromRender ?? '—' }}</dd>
    </dl>
    <nav>
      <Link href="/">
        Back home
      </Link>
    </nav>
  </div>
</template>

<style scoped>
.shared-demo {
  max-width: 40rem;
}

.lead {
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.35rem 1rem;
  margin: 0 0 1.5rem;
}

@media (min-width: 32rem) {
  dl {
    grid-template-columns: auto 1fr;
  }
}

dt {
  font-weight: 600;
  color: var(--muted, #6b7280);
}

dd {
  margin: 0;
}

nav {
  margin-top: 1rem;
}
</style>
