import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Env, Input, MiddlewareHandler, ValidationTargets } from 'hono'
import { sValidator } from '@hono/standard-validator'
import { toInertiaErrors, type ToInertiaErrorsOptions } from '@sneakylenny/inertia-server'
import { back, type BackOptions } from './index.js'

export type InertiaValidatorOptions = {
  /** Options forwarded to {@link toInertiaErrors} (e.g. `fallbackKey: 'text'`). */
  errors?: ToInertiaErrorsOptions
  /** Options forwarded to {@link back} (e.g. `{ fallback: '/todos', status: 302 }`). */
  back?: BackOptions
}

type HasUndefined<T> = undefined extends T ? true : false

/**
 * Inertia-flavoured [Standard Schema](https://standardschema.dev/) validator middleware.
 *
 * Thin wrapper around
 * [`@hono/standard-validator`](https://github.com/honojs/middleware/tree/main/packages/standard-validator)
 * that automatically flashes validation failures through {@link back} so the next
 * request surfaces them as `page.props.errors`. Requires `createInertia({ flashSecret })`.
 *
 * For custom failure handling, use `sValidator` directly — this helper is intentionally
 * zero-config.
 *
 * @example
 * ```ts
 * import { inertiaValidator } from '@sneakylenny/inertia-hono/validator'
 * import * as v from 'valibot'
 *
 * const schema = v.object({ text: v.pipe(v.string(), v.minLength(1)) })
 *
 * app.post('/todos', inertiaValidator('json', schema), (c) => {
 *   const { text } = c.req.valid('json') // fully typed
 *   // …
 * })
 * ```
 */
export function inertiaValidator<
  Schema extends StandardSchemaV1,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  In = StandardSchemaV1.InferInput<Schema>,
  Out = StandardSchemaV1.InferOutput<Schema>,
  I extends Input = {
    in: HasUndefined<In> extends true
      ? {
          [K in Target]?: In extends ValidationTargets[K]
            ? In
            : { [K2 in keyof In]?: ValidationTargets[K][K2] }
        }
      : {
          [K in Target]: In extends ValidationTargets[K]
            ? In
            : { [K2 in keyof In]: ValidationTargets[K][K2] }
        }
    out: { [K in Target]: Out }
  },
  V extends I = I,
>(
  target: Target,
  schema: Schema,
  options: InertiaValidatorOptions = {},
): MiddlewareHandler<E, P, V> {
  return sValidator<Schema, Target, E, P, In, Out, I, V>(
    target,
    schema,
    async (result, c) => {
      if (result.success) return
      return back(
        c,
        { errors: toInertiaErrors(result.error, options.errors) },
        options.back,
      )
    },
  )
}
