# 0003 · No store: the URL holds list state, a memo holds films

## Context

The list has a search query and a page. They need to survive a reload, work with back/forward,
be shareable as a link, and be restored when the user returns from a planet's page. The film
catalogue (six films) is needed by every planet card and by the detail view.

## Decision

- **The URL is the source of truth for committed list state:** `/?search=hoth&page=2`.
  Defaults are omitted, so the unfiltered first page is a clean `/`. `usePlanetSearch` reads
  `route.query`, and a single watcher loads data whenever it changes. That one path covers
  typing, paging, back/forward, a pasted link and the first render.
- The **search field's text is local state**. It reaches the URL only after the debounce, so the
  URL never holds a half-typed word. Back/forward updates the field to match the URL.
- **Search uses `router.replace`, paging uses `router.push`.** Typing does not fill the history,
  and Back steps through pages the way users expect.
- **Films are memoised in a module-level promise** (`useFilms`). One request is shared by every
  consumer. A failed request clears the memo so a later call can retry.
- The detail view's back link returns to the exact list URL the user came from
  (`history.state.back`), or to `/` when the planet was opened directly.

## Consequences

- No Pinia: the only shared data is the film catalogue and planets already seen in the list
  ([0012](0012-motion-and-identity.md)). Each is a small module-level memo, and SWAPI data is
  static, so nothing needs invalidating. If the app grew to editable data or optimistic updates,
  a store or TanStack Query would become worth it.
- **The list is kept alive** (`<KeepAlive include="PlanetsView">`) while a planet is open.
  Back is instant, with no re-fetch, and returns to the same scroll position (`savedPosition`);
  the cards are also there for the detail → list morph. While away, the list freezes its own
  query, so it never reads the detail page's URL. It also drops unsaved typing and cancels its
  timer, so a late debounce cannot navigate away from a planet. The in-page "All planets" link
  is a new navigation and starts at the top.
- The URL can be edited by hand. Malformed `page` values fall back to 1, and an out-of-range page
  gets a dedicated "Go to page 1" state ([0006](0006-error-handling.md)).
