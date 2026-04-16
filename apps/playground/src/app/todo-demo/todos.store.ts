/** Max todos for this demo (mirrored in `Todos.vue`). */
export const MAX_TODOS = 10

export type Todo = {
  id: number
  text: string
  done: boolean
}

export type AddTodoResult
  = | { ok: true, todo: Todo }
    | { ok: false, error: 'empty' | 'limit' }

const state = {
  nextId: 4,
  items: [
    { id: 1, text: 'Buy groceries', done: false },
    { id: 2, text: 'Finish project', done: false },
    { id: 3, text: 'Call mom', done: false },
  ] as Todo[],
}

/** Snapshot for Inertia props (immutable copy). */
export function listTodos(): Todo[] {
  return state.items.map(t => ({ ...t }))
}

export function addTodo(text: string): AddTodoResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, error: 'empty' }
  if (state.items.length >= MAX_TODOS) return { ok: false, error: 'limit' }
  const todo: Todo = { id: state.nextId++, text: trimmed, done: false }
  state.items.push(todo)
  return { ok: true, todo }
}

export function removeTodo(id: number): void {
  const i = state.items.findIndex(t => t.id === id)
  if (i !== -1) state.items.splice(i, 1)
}

export function toggleTodo(id: number): void {
  const t = state.items.find(x => x.id === id)
  if (t) t.done = !t.done
}

/** For demos: pretend something outside Inertia wrote to the "database". */
export function pushBackgroundTodo(): Todo | null {
  const result = addTodo(`Background update at ${new Date().toLocaleTimeString()}`)
  return result.ok ? result.todo : null
}
