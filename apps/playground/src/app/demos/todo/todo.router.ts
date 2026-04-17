import { sValidator } from '@hono/standard-validator'
import { Hono } from 'hono'
import {
  render,
  toInertiaErrors,
  type InertiaVariables,
} from 'inertia-hono'
import {
  addTodo,
  listTodos,
  pushBackgroundTodo,
  removeTodo,
  toggleTodo,
} from './todos.store.js'
import { MAX_TODOS, newTodoSchema } from './todo.validation.js'

const app = new Hono<{ Variables: InertiaVariables }>()

app.get('/todos', c => render(c, 'Todos', { todos: listTodos() }))

app.post(
  '/todos',
  sValidator('json', newTodoSchema, (result, c) => {
    if (result.success) return
    return render(c, 'Todos', {
      todos: listTodos(),
      errors: toInertiaErrors(result.error, { fallbackKey: 'text' }),
    })
  }),
  (c) => {
    const { text } = c.req.valid('json')
    const result = addTodo(text)
    if (!result.ok) {
      const errors
        = result.error === 'empty'
          ? { text: 'Add some text for the todo.' }
          : {
              text: `You can only have up to ${MAX_TODOS} todos. Remove one to add another.`,
            }
      return render(c, 'Todos', { todos: listTodos(), errors })
    }
    return c.redirect('/todos', 303)
  },
)

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
