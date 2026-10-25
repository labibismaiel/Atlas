# 0006 · Error model, timeout and recovery

## Context

swapi.dev is free and occasionally slow, down, or hangs without ever answering. From the UI's
point of view, a failure must be distinguishable from "no results" and must always be
recoverable. Cancellation is not a failure.

## Decision

- [`getJson`](../../src/api/http.ts) turns every failure into an `ApiError` with a `kind`:

  | kind        | cause                                 | typical UI                                  |
  | ----------- | ------------------------------------- | ------------------------------------------- |
  | `network`   | `fetch` rejected (offline, DNS, CORS) | error panel + Retry                         |
  | `timeout`   | no response within 15 s               | error panel + Retry                         |
  | `http`      | non-2xx status other than 404         | error panel + Retry                         |
  | `not-found` | 404                                   | "not in the archive" / "page doesn't exist" |
  | `parse`     | body is not valid JSON                | error panel + Retry                         |

- **Caller aborts are re-thrown untouched** (`AbortError`), so callers can ignore them with
  `isAbortError`. The timeout uses the same internal `AbortController`, but is reported as
  `timeout`, never as an abort.
- **Retry is manual and exact**: it re-runs the current query and page through the same
  latest-request guard, so it can never revive a superseded request.
- **Context-specific 404s**: an unknown planet id shows a not-found page with a link to the list
  (no pointless retry). A `?page=` past the end shows "Page N doesn't exist" with "Go to page 1",
  keeping the query.
- **Partial failures degrade gracefully**: missing resident names are counted, and an
  unavailable film catalogue is labelled instead of hidden.
- The configurable base URL (`VITE_SWAPI_BASE_URL`) lets a deployment point at a mirror without
  a code change.

## Consequences

- No automatic retries or exponential backoff. For a user-driven, read-only UI, an explicit
  "Retry" is predictable and avoids sending extra load to an API that is already struggling.
- No offline cache or service worker: out of scope for the brief.
- The 15 s timeout is a judgement call. It is long enough for a slow SWAPI response and short
  enough that a hung request doesn't leave the user waiting indefinitely.
