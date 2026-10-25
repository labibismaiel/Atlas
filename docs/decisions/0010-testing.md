# 0010 · Testing strategy

## Context

The brief evaluates testing knowledge (unit and integration). The search spec lists eight
behaviours that must be covered with mocked network responses, never the live API. End-to-end
tests were explicitly ruled out for now.

## Decision

- **Vitest + Vue Test Utils + jsdom**, mounting real components with a real router
  (`createMemoryHistory`, or `createWebHistory` where `history.state` matters).
- **Network is faked at the `fetch` boundary**, not by mocking our own modules, so the service
  layer, mappers and composables are exercised for real.
  [`controlledFetch`](../../src/test/fetch.ts) keeps every request pending until the test
  resolves or rejects it, and records URL and abort state. That makes out-of-order responses
  deterministic. With `honourAbort: false` it simulates a response that had already arrived when
  `abort()` was called, which proves the version guard works independently of AbortController.
- **Fake timers** for the debounce (nothing at 299 ms, one request at 300 ms), the timeout,
  and checks that timers are cleaned up.
- **Layers**:
  - Unit: mappers, URL building, error normalisation, timeout, formatting, the summary sentence,
    biome rules.
  - Composable "integration": `usePlanetSearch`, `useFilms`, mounted in a tiny harness with a
    router.
  - View integration: `PlanetsView` and `PlanetDetailView` with the DOM, covering cards, counts,
    states, focus and links.

Where each of the eight required search behaviours is tested:

| Requirement                                            | Test file / `describe`                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 1. No request before 300 ms; one for the latest query  | `usePlanetSearch.spec.ts` › debounce                                                   |
| 2. Search parameter encoding, trimmed/blank queries    | `usePlanetSearch.spec.ts` › server-side search parameter; `swapi.spec.ts` › planetsUrl |
| 3. Results replace cards, API total shown              | `usePlanetSearch.spec.ts` › results; `PlanetsView.spec.ts`                             |
| 4. New query resets page; paging keeps the query       | `usePlanetSearch.spec.ts` › pagination; `PlanetsView.spec.ts`                          |
| 5. Clear cancels debounce and request, restores page 1 | `usePlanetSearch.spec.ts` › clear; `PlanetsView.spec.ts`                               |
| 6. Abort, ignored AbortError, late handlers inert      | `usePlanetSearch.spec.ts` › cancellation and stale responses                           |
| 7. Loading, zero matches, error, retry                 | `usePlanetSearch.spec.ts` › states; `PlanetsView.spec.ts`                              |
| 8. Cleanup on unmount                                  | `usePlanetSearch.spec.ts` › cleanup                                                    |

## Consequences

- 113 tests run in about 4 s. Statement coverage is about 91% (`npm run test:coverage`).
  Coverage is a sanity check, not a target.
- jsdom does not render SVG filters or lay out the page, so visual quality was reviewed manually
  and in Storybook. No visual-regression tooling was added.
- No E2E (Playwright/Cypress) by agreement. The view-level tests cover the user flows that matter
  without a browser. E2E would be the next step before a production launch.
