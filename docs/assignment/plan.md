# Nmbrs SWAPI Vue technical test — implementation plan

## Goal and boundaries

Deliver mandatory debounced server-side planet search that updates the existing cards directly, with no autocomplete. Preserve the original assignment scope, current required features, and polished dark space design. This plan defines the search change; the existing assignment remains authoritative for all other requirements.

## 1. Inspect the existing application

- Read the assignment and repository instructions; identify Vue conventions, API client, planet listing, pagination, design styles, and test commands.
- Keep existing technology and component patterns. Identify where search state and request ownership fit without introducing unnecessary dependencies.
- Record existing behavior and visual treatment so the change preserves planet-card content, interactions, responsive layout, and the dark space aesthetic.

## 2. Extend the data flow

- Extend the existing planets request to accept the normalized search query, page, and AbortSignal. Construct encoded query parameters using the existing API configuration.
- Keep input text separate from the effective trimmed query. Treat whitespace-only text as an empty query.
- Track cards, API total count, pagination metadata, loading, error, and the query associated with resolved results.
- Use a monotonically increasing request/version token alongside AbortController. All success, failure, and finally paths must verify current ownership before writing state.

## 3. Implement debounce and cancellation

- On each effective query change, reset the page to 1, invalidate the current request/version, abort it immediately, and cancel the prior timer.
- After 300ms without a further change, request page 1 for the latest normalized query. Equivalent normalized text must not cause redundant fetches.
- Route pagination through the same request ownership and cancellation flow; retain the active query on every page request.
- Clear must cancel the timer, invalidate/abort the request, empty the input/query, reset to page 1, and immediately request the unfiltered list. Restore input focus.
- Ignore expected AbortError. On unmount, clear the timer, invalidate ownership, and abort the request.

## 4. Integrate the existing UI

- Add a labelled search field and accessible clear control above the planet cards, styled to match the current design.
- Replace the existing cards with the successful server response. Do not add autocomplete, suggestions, a dropdown, or another results screen.
- Display the API total count with correct singular/plural wording, tied to the resolved query.
- Provide loading, empty, and recoverable error feedback, including retry for the current query/page and a clear-search action for no matches.
- While the query is unsettled or a replacement request is pending, hide old results/count or mark them clearly as updating. Disable stale pagination and prevent old results from appearing to match the new query.
- Preserve existing pagination styling and use returned pagination metadata. Distinguish errors from successful zero-result responses.
- Check keyboard flow, focus visibility, status announcements, responsive spacing, and reduced motion. Preserve the polished dark space design and existing scope.

## 5. Test behavior

Use fake timers and controlled mocked network responses in the existing test stack.

- Assert no search call at 299ms and the latest query request at 300ms; rapid typing produces only one request.
- Assert encoded server search parameters, trimmed input, and whitespace-only handling; prove results come from the response rather than current-page filtering.
- Assert returned cards replace the grid and the count uses the API total, including totals larger than one page.
- Start on a later page, change query, and assert page 1; paginate and assert the query persists.
- Clear both during debounce and during a request; assert immediate unfiltered page 1, aborted requests, and no old timer or response restoring the query.
- Resolve or reject older requests after newer ones and during the debounce interval. Assert no stale cards, count, pagination, error, or loading changes, including from finally handlers. Assert AbortSignal cancellation and no visible error for AbortError.
- Assert loading, empty results, genuine errors, and retry of the current query/page.
- Unmount with a pending timer/request and assert cleanup and no subsequent state updates.

## 6. Validate and deliver

- Run relevant tests and the assignment's existing required checks. Resolve failures caused by this change.
- Review the listing at desktop and mobile sizes and with keyboard navigation; verify design consistency and every feedback state.
- Confirm mandatory search, 300ms debounce, cancellation/race protection, clear, result count, pagination reset, and absence of autocomplete.
- Report implementation changes, checks performed, and any remaining limitations without adding unrelated features.
