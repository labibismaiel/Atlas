# 0004 · Search: debounce, AbortController and a version guard

## Context

Search is required and must run on the server through SWAPI's `?search=` parameter. Typing
quickly creates a stream of queries whose responses can arrive in any order. A stale response
must never overwrite newer cards, the count, the pagination, the loading flag or the error.

## Decision

All of this lives in [`usePlanetSearch`](../../src/composables/usePlanetSearch.ts):

1. **Normalise**: trim the input; whitespace-only means "no search". If the input normalises to
   the same query (for example, a trailing space was typed), nothing happens.
2. **Invalidate immediately**: on every effective change, cancel the pending timer and abort the
   in-flight request _before_ the new debounce starts. A response for the old query cannot land
   while the user is still typing.
3. **Debounce 300 ms**, then commit `?search=<q>` (page reset to 1) to the URL, which triggers
   the single load path ([0003](0003-state-and-url.md)).
4. **Latest request wins**: [`createLatestRequest`](../../src/utils/latestRequest.ts) gives each
   request an `AbortSignal` and a version ticket. Every success, failure and `finally` handler
   checks `ticket.isCurrent()` before writing state. Abort alone is not enough: a response may
   already have resolved, or a `finally` may already be queued, when `abort()` is called.
   `AbortError` is treated as expected and never shown to the user.
5. **Clear** cancels the timer, aborts the request, empties the field and commits the unfiltered
   page 1 immediately. Focus stays in the field.
6. **Unmount** clears the timer and aborts the request.

The view renders an explicit state, so stale data is never presented as current:

| State      | Meaning                                          | UI                                                                                              |
| ---------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `loading`  | first load, nothing to show                      | skeleton cards                                                                                  |
| `updating` | query unsettled or a replacement request pending | old cards dimmed and `inert`, "Updating results…", pagination disabled, count says "Searching…" |
| `ready`    | results for the current query and page           | cards, API total ("23 planets matching “o”"), pagination                                        |
| `empty`    | successful response, zero matches                | empty panel with "Clear search"                                                                 |
| `error`    | genuine failure for the current query and page   | error panel with "Retry" (same query and page)                                                  |

## Consequences

- No lodash/VueUse `useDebounceFn`. The timer has to be cancelled together with the request
  (on clear, on back/forward, on unmount). A plain `setTimeout` in the same closure makes that
  explicit and easy to test with fake timers.
- No TanStack Query. It would deduplicate and cache, but the requirement is about precise
  cancellation semantics, which are clearer written out by hand than configured.
- Paging is only allowed from the `ready` state, so a click on stale pagination does nothing.
- No autocomplete or suggestions, as the brief asks. Results replace the grid directly.
- The total count comes from the API's `count`, not from the number of cards, and it is only
  shown for the query that resolved it.
