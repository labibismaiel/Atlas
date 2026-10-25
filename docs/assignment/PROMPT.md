# Nmbrs SWAPI Vue technical test — implementation prompt

Implement the Nmbrs SWAPI Vue technical test in the existing application. Inspect the repository and assignment first. Preserve the original assignment's scope, required functionality, technology choices, and polished dark space design. Integrate the search below into the existing planet listing; do not add unrelated features or redesign the application.

## Required planet search

Search is mandatory. Provide a clearly labelled planet-name search field above the planet cards. Search must run on the server through the configured SWAPI planets endpoint using its `search` query parameter. Do not filter only the currently loaded page or download the entire catalogue for client-side filtering.

- Debounce typing by **300ms** after the latest input change. Trim surrounding whitespace before requesting; whitespace-only input means no search query.
- Render returned planets directly in the existing planet-card grid. Do not implement autocomplete, suggestions, a dropdown, or a separate search-results view.
- On an effective query change, reset pagination to page 1. Subsequent page requests must retain the active search query. Use the API's pagination metadata and preserve the existing pagination presentation.
- Provide an accessible clear control when the field contains text. Clearing cancels the pending debounce and current request, clears the query, resets pagination, and immediately loads the unfiltered first page. It must not allow an earlier timer to reapply the old query. Keep focus in the search field.
- Use **AbortController** to cancel superseded requests, including list and pagination requests. Invalidate and abort the current request as soon as the query changes, before the next debounced request starts. Cancel timers and requests on unmount.
- Also guard every response, error, and finalization with a current request/version check. A cancelled or late request must never overwrite cards, count, pagination, loading, or error state for a newer query. Treat AbortError as expected cancellation, without user-facing error feedback.
- Show clear loading feedback during requests. During the debounce interval or a pending replacement request, do not present old cards or counts as results for the new query; hide them or explicitly mark them as updating. Disable stale pagination actions.
- Show a helpful empty state when the successful response contains no matches, with a way to clear the search.
- Show recoverable error feedback with retry for genuine request failures. Retry the current query and page; do not revive a superseded request. Do not present a failure as zero matches.
- Show the total results count from the API, not the number of cards on the current page. Keep the count associated with the successfully resolved query and handle singular/plural wording.
- Retain a visible label, keyboard usability, clear focus indicators, and accessible status announcements without excessive announcements while typing.

## Visual and scope constraints

Preserve the polished dark space visual direction: existing dark surfaces, planet artwork, typography, spacing, responsive card layout, restrained accents, and subtle motion. Style search, clear, status feedback, count, and pagination consistently with that design. Respect reduced-motion preferences. Keep existing planet-card content and interactions and all other assignment requirements intact. Do not expand into a galaxy visualization, 3D interaction, or other unrelated features.

## Required verification

Use the project's existing test stack and mock network responses; do not depend on the live API. Add meaningful search behavior tests covering:

1. No request before 300ms; one request for the latest query after rapid typing.
2. Server-side search parameter encoding and trimmed/blank queries.
3. Search responses replace the cards directly and display the API's total count.
4. Query changes reset pagination; subsequent pages preserve the active query.
5. Clear cancels pending debounce and in-flight requests and immediately restores unfiltered page 1.
6. AbortController cancellation, ignored AbortError, and late success/error/finally handlers that cannot mutate newer state, including during the debounce interval.
7. Loading, zero matches, genuine error, and retry behavior.
8. Cleanup of pending timers and requests on unmount.

Run the relevant tests, existing required checks, and a responsive visual review. Summarize the changes, validation, and any unresolved limitations. Implement the feature, not only a plan.
