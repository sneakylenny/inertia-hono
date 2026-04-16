import type { BaseIssue } from 'valibot'
import { getDotPath, maxLength, minLength, object, pipe, string, trim } from 'valibot'

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

/**
 * Map Valibot issues to Inertia `errors` page props (one string per field; dotted keys for nested paths).
 * @see https://inertiajs.com/docs/v3/the-basics/forms#form-errors
 */
export function inertiaFieldErrors(
  issues: readonly BaseIssue<unknown>[],
): Record<string, string> {
  const errors: Record<string, string> = {}
  const pathless: string[] = []
  for (const issue of issues) {
    const path = getDotPath(issue)
    if (path === null || path === '') {
      pathless.push(issue.message)
    }
    else if (!(path in errors)) {
      errors[path] = issue.message
    }
  }
  if (pathless.length && Object.keys(errors).length === 0) {
    return { text: pathless[0] ?? 'Invalid input.' }
  }
  return errors
}
