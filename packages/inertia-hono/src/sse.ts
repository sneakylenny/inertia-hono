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

/**
 * Open a Server-Sent Events response with a small, JSON-friendly writer helper.
 * Mirrors the request-first ergonomics used by `render()` and `share()`.
 */
export function sse(
  c: Context,
  handler: (
    send: InertiaSSESend,
    stream: SSEStreamingApi,
  ) => void | Promise<void>,
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
        await handler(send, stream)
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
