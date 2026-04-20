export type LivePressEvent = {
  id: number
  message: string
  at: string
}

const MAX_EVENTS = 20

const state = {
  nextId: 1,
  events: [] as LivePressEvent[],
}

const listeners = new Set<(entry: LivePressEvent) => void>()

export function listPressEvents(): LivePressEvent[] {
  return state.events.map(event => ({ ...event }))
}

export function subscribePressEvents(listener: (entry: LivePressEvent) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function recordButtonPress(): LivePressEvent {
  const entry: LivePressEvent = {
    id: state.nextId++,
    message: `Button press #${state.nextId - 1}`,
    at: new Date().toLocaleTimeString(),
  }

  state.events.unshift(entry)
  if (state.events.length > MAX_EVENTS) {
    state.events.length = MAX_EVENTS
  }

  for (const listener of listeners) listener({ ...entry })
  return { ...entry }
}
