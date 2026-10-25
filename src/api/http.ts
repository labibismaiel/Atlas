export type ApiErrorKind = 'network' | 'http' | 'not-found' | 'parse'

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
}

/** GET a JSON resource. Throws {@link ApiError} on failure, or the original AbortError when cancelled. */
export async function getJson<T>(url: string, { signal }: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError('network', 'Could not reach the server. Check your connection.')
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
    if (isAbortError(error)) throw error
    throw new ApiError('parse', 'The server sent a response we could not read.')
  }
}
