export type Todo = {
  id: number
  text: string
  done: boolean
}

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

export function addTodo(text: string): Todo | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const todo: Todo = { id: state.nextId++, text: trimmed, done: false }
  state.items.push(todo)
  return todo
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
export function pushBackgroundTodo(): Todo {
  return addTodo(`Background update at ${new Date().toLocaleTimeString()}`)!
}
