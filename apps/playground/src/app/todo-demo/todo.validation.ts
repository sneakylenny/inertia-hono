import { pipe, object, string, trim, minLength, maxLength } from 'valibot'

/** Max todos for this demo. */
export const MAX_TODOS = 10

/** Max length for todo text (enforced by `newTodoSchema`). */
export const MAX_TODO_TEXT_LENGTH = 64

export const newTodoSchema = object({
  text: pipe(
    string(),
    trim(),
    minLength(1, 'Add some text for the todo.'),
    maxLength(
      MAX_TODO_TEXT_LENGTH,
      `Todo text must be ${MAX_TODO_TEXT_LENGTH} characters or fewer.`,
    ),
  ),
})
