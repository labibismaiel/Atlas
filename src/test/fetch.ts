import { vi } from 'vitest'

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export interface PendingRequest {
  url: string
  signal: AbortSignal | undefined
  /** True once the caller aborted the request. */
  readonly aborted: boolean
  respond(body: unknown, status?: number): Promise<void>
  fail(error?: unknown): Promise<void>
}

/**
 * Replaces global `fetch` with a manually controlled fake: every call stays pending until the
 * test resolves or rejects it, so out-of-order responses can be simulated deterministically.
 * Like the real fetch, an aborted signal rejects the promise with an AbortError.
 */
export function controlledFetch() {
  const requests: PendingRequest[] = []

  const fetchMock = vi.fn<typeof fetch>((input, init) => {
    const signal = init?.signal ?? undefined
    return new Promise<Response>((resolve, reject) => {
      const settle = async (action: () => void) => {
        action()
        // Let the awaiting code (response.json(), state updates) run before the test continues.
        await flushPromises()
      }
      signal?.addEventListener('abort', () =>
        reject(new DOMException('The operation was aborted.', 'AbortError')),
      )
      requests.push({
        url: String(input),
        signal,
        get aborted() {
          return signal?.aborted ?? false
        },
        respond: (body, status = 200) => settle(() => resolve(jsonResponse(body, status))),
        fail: (error = new TypeError('Failed to fetch')) => settle(() => reject(error)),
      })
    })
  })

  vi.stubGlobal('fetch', fetchMock)

  return {
    fetchMock,
    requests,
    get last(): PendingRequest {
      const request = requests.at(-1)
      if (!request) throw new Error('No request has been made')
      return request
    },
    /** Requests for a URL path segment, e.g. "/planets/". */
    to(fragment: string) {
      return requests.filter((request) => request.url.includes(fragment))
    },
  }
}

export async function flushPromises(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}
