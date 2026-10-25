# 0005 · Fetching films and residents

## Context

A planet only holds URLs for its films and residents. The list must show film _names_. The
detail view must show everything, including resident names. SWAPI has no batch or "expand"
endpoint.

## Decision

- **Films: one catalogue request, cached.** The whole film catalogue is six entries on a single
  page (`fetchFilms` follows `next` defensively). It is fetched once and shared by every card and
  view, so ten cards make one request instead of up to sixty. Titles are sorted by release date.
- Cards show film chips once the catalogue has loaded, shimmer while it loads, and say "Film
  titles unavailable" if it fails. A failure is never presented as "not in any film".
- **Residents: fetched per id, in parallel, on the detail view only**, after the planet itself
  has rendered. `Promise.allSettled` lets one failing resident not hide the others. The view
  says how many could not be loaded. These requests share the planet's request ticket, so
  navigating to another planet aborts them.

## Consequences

- The detail view of a busy planet (Tatooine: 10 residents) makes 10 small parallel requests.
  This is acceptable for a read-only demo. A real product would add a batch endpoint or a proxy
  instead of more client-side code.
- Residents are not shown on list cards: it would add up to ~100 requests per page for little
  value.
- Film failures on the list have no inline retry. A reload or the detail page's "Retry" re-runs
  the request, because the memo is cleared on failure.
