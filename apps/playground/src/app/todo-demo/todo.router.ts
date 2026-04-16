import { Hono } from 'hono'
import { render, type InertiaVariables } from 'inertia-hono'
import {
  MAX_TODOS,
  addTodo,
  listTodos,
  pushBackgroundTodo,
  removeTodo,
  toggleTodo,
} from './todos.store.js'

const app = new Hono<{ Variables: InertiaVariables }>()

const todosPageProps = () => ({ todos: listTodos() })

app.get('/todos', c =>
  render(c, 'Todos', todosPageProps()),
)

app.post('/todos', async (c) => {
  const ct = c.req.header('content-type') ?? ''
  const text = ct.includes('application/json')
    ? String(((await c.req.json()) as Record<string, unknown>).text ?? '')
    : String((await c.req.parseBody()).text ?? '')
  const result = addTodo(text)
  if (!result.ok) {
    const errors
      = result.error === 'empty'
        ? { text: 'Add some text for the todo.' }
        : {
            text: `You can only have up to ${MAX_TODOS} todos. Remove one to add another.`,
          }
    return render(c, 'Todos', { ...todosPageProps(), errors })
  }
  return c.redirect('/todos', 303)
})

app.post('/todos/:id/toggle', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.redirect('/todos', 303)
  toggleTodo(id)
  return c.redirect('/todos', 303)
})

app.delete('/todos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isFinite(id)) removeTodo(id)
  return c.redirect('/todos', 303)
})

app.post('/api/todos/push', (c) => {
  const todo = pushBackgroundTodo()
  if (!todo) return c.json({ ok: false as const, error: 'limit' as const })
  return c.json({ ok: true as const })
})

export default app
