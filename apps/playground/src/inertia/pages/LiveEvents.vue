<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LiveStatus from '../components/LiveStatus.vue'

type LivePressEvent = {
  id: number
  message: string
  at: string
}

const props = defineProps<{
  initialEvents: LivePressEvent[]
}>()

const events = ref<LivePressEvent[]>([])
const liveStatus = ref<'connecting' | 'connected' | 'reconnecting' | 'unsupported'>('connecting')
const sending = ref(false)

watch(
  () => props.initialEvents,
  (nextEvents) => {
    events.value = nextEvents.map(event => ({ ...event }))
  },
  { immediate: true },
)

let source: EventSource | null = null

onMounted(() => {
  if (typeof EventSource === 'undefined') {
    liveStatus.value = 'unsupported'
    return
  }

  source = new EventSource('/api/live-events/stream')
  source.onopen = () => {
    liveStatus.value = 'connected'
  }
  source.onerror = () => {
    liveStatus.value = 'reconnecting'
  }
  source.addEventListener('ready', (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as {
      connected?: boolean
      events?: LivePressEvent[]
    }
    if (Array.isArray(payload.events)) {
      events.value = payload.events
    }
  })
  source.addEventListener('pressed', (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as LivePressEvent
    events.value = [payload, ...events.value.filter(item => item.id !== payload.id)].slice(0, 20)
  })
})

onBeforeUnmount(() => {
  source?.close()
  source = null
})

async function pressButton() {
  sending.value = true
  try {
    await fetch('/api/live-events/press', { method: 'POST' })
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <Head title="Live Events" />
  <div class="container mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Live Events
    </h1>
    <p class="mt-2 text-base-content/70">
      Press the button to emit a server event. Connected clients will see the log update in real time.
    </p>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        class="btn btn-primary"
        :disabled="sending"
        @click="pressButton"
      >
        {{ sending ? 'Sending…' : 'Press button' }}
      </button>
      <LiveStatus
        :status="liveStatus"
        text="Watching the SSE stream for button-press events."
      />
    </div>

    <div class="mt-6 rounded-box border border-base-300 bg-base-100 p-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/70">
        Event log
      </h2>
      <ul
        v-if="events.length > 0"
        class="mt-3 space-y-2"
      >
        <li
          v-for="event in events"
          :key="event.id"
          class="rounded-lg border border-base-300 px-3 py-2"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="font-medium">{{ event.message }}</span>
            <span class="text-sm text-base-content/60">{{ event.at }}</span>
          </div>
        </li>
      </ul>
      <p
        v-else
        class="mt-3 text-sm text-base-content/60"
      >
        No events yet — press the button to create one.
      </p>
    </div>
  </div>
</template>
