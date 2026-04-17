import type { StandardSchemaV1 } from '@standard-schema/spec'

/** Inertia `errors` page prop: one message per field, keyed by dotted path. */
export type InertiaErrors = Record<string, string>

export type ToInertiaErrorsOptions = {
  /**
   * Field key used when every issue is pathless (e.g. the whole input was rejected).
   * @default 'form'
   */
  fallbackKey?: string
  /**
   * Message used under `fallbackKey` when there are pathless issues but none carry a message.
   * @default 'Invalid input.'
   */
  fallbackMessage?: string
}

/**
 * Convert [Standard Schema](https://standardschema.dev/) issues into Inertia's
 * [`errors` page prop](https://inertiajs.com/docs/v3/the-basics/forms#form-errors):
 * one string per field, keyed by dotted path (e.g. `items.0.name`).
 *
 * Works with any library that implements Standard Schema (Valibot, Zod v3+, ArkType, Effect Schema, etc.)
 * and pairs well with [`@hono/standard-validator`](https://github.com/honojs/middleware/tree/main/packages/standard-validator).
 *
 * Behavior:
 * - The first issue per path wins (later issues for the same field are dropped).
 * - Pathless issues are ignored when at least one field-level issue exists.
 * - If every issue is pathless, a single entry is returned under `fallbackKey`.
 *
 * @example
 * ```ts
 * app.post(
 *   '/todos',
 *   sValidator('json', schema, (result, c) => {
 *     if (result.success) return
 *     return render(c, 'Todos', { errors: toInertiaErrors(result.error) })
 *   }),
 *   handler,
 * )
 * ```
 */
export function toInertiaErrors(
  issues: readonly StandardSchemaV1.Issue[],
  options: ToInertiaErrorsOptions = {},
): InertiaErrors {
  const { fallbackKey = 'form', fallbackMessage = 'Invalid input.' } = options
  const errors: InertiaErrors = {}
  const pathless: string[] = []

  for (const issue of issues) {
    const path = issueDotPath(issue)
    if (path === '') {
      pathless.push(issue.message)
    }
    else if (!(path in errors)) {
      errors[path] = issue.message
    }
  }

  if (pathless.length > 0 && Object.keys(errors).length === 0) {
    return { [fallbackKey]: pathless[0] ?? fallbackMessage }
  }
  return errors
}

/**
 * Render a Standard Schema issue `path` as a dotted string (e.g. `user.addresses.0.city`).
 * Returns `''` for pathless issues (top-level failures).
 */
export function issueDotPath(issue: StandardSchemaV1.Issue): string {
  const path = issue.path
  if (!path || path.length === 0) return ''
  let out = ''
  for (let i = 0; i < path.length; i++) {
    const segment = path[i]
    const key
      = segment !== null && typeof segment === 'object'
        ? segment.key
        : segment
    if (i > 0) out += '.'
    out += pathKeyToString(key)
  }
  return out
}

function pathKeyToString(key: PropertyKey | undefined): string {
  if (typeof key === 'symbol') return key.description ?? ''
  if (key === undefined) return ''
  return String(key)
}
