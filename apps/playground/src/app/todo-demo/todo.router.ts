import { Hono } from 'hono'
import { render, type InertiaVariables } from 'inertia-hono'
import {
  addTodo,
  listTodos,
  pushBackgroundTodo,
  removeTodo,
  toggleTodo,
} from './todos.store.js'

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/todos', c =>
  render(c, 'Todos', { todos: listTodos() }),
)

app.post('/todos', async (c) => {
  const ct = c.req.header('content-type') ?? ''
  const text = ct.includes('application/json')
    ? String(((await c.req.json()) as Record<string, unknown>).text ?? '')
    : String((await c.req.parseBody()).text ?? '')
  const todo = addTodo(text)
  if (!todo) {
    return render(c, 'Todos', {
      todos: listTodos(),
      errors: { text: 'Add some text for the todo.' },
    })
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
  pushBackgroundTodo()
  return c.json({ ok: true as const })
})

export default app
