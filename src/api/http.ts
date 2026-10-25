export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'not-found' | 'parse'

/** SWAPI occasionally hangs instead of failing; give up and let the user retry. */
export const REQUEST_TIMEOUT_MS = 15_000

/**
 * A genuine request failure, normalised so the UI can choose a message without
 * inspecting `Response` objects. Cancellation is deliberately NOT an ApiError:
 * aborts are rethrown untouched and filtered with {@link isAbortError}.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

/** Cancellation from AbortController. Checked by name: DOMException may come from another realm. */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  )
}

export interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * GET a JSON resource. Throws {@link ApiError} on failure (including a timeout), or the
 * original AbortError when the caller cancels.
 */
export async function getJson<T>(
  url: string,
  { signal, timeoutMs = REQUEST_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  // One controller per request, aborted by either the caller or the timeout.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onCallerAbort = () => {
    clearTimeout(timer)
    controller.abort()
  }
  if (signal?.aborted) onCallerAbort()
  else signal?.addEventListener('abort', onCallerAbort, { once: true })

  const fail = (error: unknown, fallback: ApiError): never => {
    if (timedOut) throw new ApiError('timeout', 'The server took too long to respond.')
    if (isAbortError(error)) throw error
    throw fallback
  }

  try {
    let response: Response
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
    } catch (error) {
      return fail(
        error,
        new ApiError('network', 'Could not reach the server. Check your connection.'),
      )
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError('not-found', 'The requested resource does not exist.', 404)
      }
      throw new ApiError(
        'http',
        `The server responded with an error (${response.status}).`,
        response.status,
      )
    }

    try {
      return (await response.json()) as T
    } catch (error) {
      return fail(error, new ApiError('parse', 'The server sent a response we could not read.'))
    }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}
