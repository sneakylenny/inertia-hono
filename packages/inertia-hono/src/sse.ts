import type { Context } from 'hono'
import { streamSSE, type SSEStreamingApi } from 'hono/streaming'

export type InertiaSSEMessageInit = {
  event?: string
  id?: string
  retry?: number
}

export type InertiaSSESend = (
  data: unknown,
  init?: InertiaSSEMessageInit,
) => Promise<void>

export type InertiaSSEYieldMessage = InertiaSSEMessageInit & {
  data: unknown
}

export type InertiaSSEYield = unknown | InertiaSSEYieldMessage

export type InertiaSSEHandlerResult
  = | void
    | Iterable<InertiaSSEYield>
    | AsyncIterable<InertiaSSEYield>

export type InertiaSSEHandler = (
  send: InertiaSSESend,
  stream: SSEStreamingApi,
) => InertiaSSEHandlerResult | Promise<InertiaSSEHandlerResult>

export type InertiaSSEHeartbeatOptions = {
  /** Interval between heartbeat messages in milliseconds. Defaults to 15000. */
  intervalMs?: number
  /** Event name for the heartbeat message. Defaults to `ping`. */
  event?: string
  /** Optional heartbeat payload. Defaults to `{ at: Date.now() }`. */
  data?: unknown | (() => unknown | Promise<unknown>)
  /** Optional retry hint sent with each heartbeat event. */
  retry?: number
}

export type InertiaSSEOptions = {
  /** Additional headers to merge into the SSE response. */
  headers?: Record<string, string>
  /** Configure a periodic heartbeat to keep long-lived SSE connections warm. */
  heartbeat?: false | number | InertiaSSEHeartbeatOptions
  /** Optional error hook before Hono emits its default `error` event. */
  onError?: (error: Error, stream: SSEStreamingApi) => void | Promise<void>
}

const DEFAULT_SSE_HEADERS = {
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
} satisfies Record<string, string>

function serializeSSEData(data: unknown): string {
  if (typeof data === 'string') return data
  return JSON.stringify(data ?? null)
}

function normalizeHeartbeat(
  heartbeat: InertiaSSEOptions['heartbeat'],
): Required<Omit<InertiaSSEHeartbeatOptions, 'data' | 'retry'>> & Pick<InertiaSSEHeartbeatOptions, 'data' | 'retry'> | null {
  if (heartbeat === undefined || heartbeat === false) return null

  const resolved = typeof heartbeat === 'number'
    ? { intervalMs: heartbeat }
    : heartbeat

  const intervalMs = resolved.intervalMs ?? 15000
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new RangeError('inertia-hono: SSE heartbeat interval must be a positive number.')
  }

  return {
    intervalMs,
    event: resolved.event ?? 'ping',
    data: resolved.data ?? (() => ({ at: Date.now() })),
    retry: resolved.retry,
  }
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
}

function isIterable<T>(value: unknown): value is Iterable<T> {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] === 'function'
}

function isStructuredYieldMessage(value: unknown): value is InertiaSSEYieldMessage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  if (!Object.hasOwn(record, 'data')) return false

  const allowed = new Set(['data', 'event', 'id', 'retry'])
  return Object.keys(record).every(key => allowed.has(key))
}

async function writeYielded(send: InertiaSSESend, yielded: InertiaSSEYield): Promise<void> {
  if (isStructuredYieldMessage(yielded)) {
    await send(yielded.data, {
      event: yielded.event,
      id: yielded.id,
      retry: yielded.retry,
    })
    return
  }
  await send(yielded)
}

/**
 * Open a Server-Sent Events response with a small, JSON-friendly writer helper.
 * Mirrors the request-first ergonomics used by `render()` and `share()`.
 */
export function sse(
  c: Context,
  handler: InertiaSSEHandler,
  options: InertiaSSEOptions = {},
): Response {
  const response = streamSSE(
    c,
    async (stream) => {
      const send: InertiaSSESend = (data, init = {}) =>
        stream.writeSSE({
          data: serializeSSEData(data),
          ...init,
        })

      const heartbeat = normalizeHeartbeat(options.heartbeat)
      const timer = heartbeat
        ? setInterval(() => {
            void Promise.resolve()
              .then(() => typeof heartbeat.data === 'function' ? heartbeat.data() : heartbeat.data)
              .then(data => send(data, {
                event: heartbeat.event,
                retry: heartbeat.retry,
              }))
              .catch(() => undefined)
          }, heartbeat.intervalMs)
        : null

      try {
        const result = await handler(send, stream)
        if (isAsyncIterable<InertiaSSEYield>(result) || isIterable<InertiaSSEYield>(result)) {
          for await (const yielded of result) {
            await writeYielded(send, yielded)
          }
        }
      }
      finally {
        if (timer) clearInterval(timer)
      }
    },
    options.onError
      ? async (error, stream) => {
        await options.onError?.(error, stream)
      }
      : undefined,
  )

  for (const [name, value] of Object.entries(DEFAULT_SSE_HEADERS)) {
    response.headers.set(name, value)
  }
  for (const [name, value] of Object.entries(options.headers ?? {})) {
    response.headers.set(name, value)
  }

  return response
}

export type { SSEStreamingApi } from 'hono/streaming'
