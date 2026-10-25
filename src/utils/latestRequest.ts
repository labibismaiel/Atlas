export interface RequestTicket {
  signal: AbortSignal
  /** False as soon as a newer request starts or the owner cancels. Check before every state write. */
  isCurrent(): boolean
}

/**
 * "Latest request wins" guard. Starting a request aborts the previous one, and every request
 * gets a version ticket. Abort alone is not enough: a response can already be resolved (or a
 * `finally` already queued) when abort is called, so writers must also check `isCurrent()`.
 */
export function createLatestRequest() {
  let version = 0
  let controller: AbortController | null = null

  function cancel(): void {
    version++
    controller?.abort()
    controller = null
  }

  function start(): RequestTicket {
    cancel()
    const current = version
    const own = new AbortController()
    controller = own
    return { signal: own.signal, isCurrent: () => current === version }
  }

  return { start, cancel }
}
