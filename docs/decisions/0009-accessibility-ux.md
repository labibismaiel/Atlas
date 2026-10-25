# 0009 · Accessibility and UX details

## Context

The brief evaluates UX and responsiveness. The search spec asks for a visible label, keyboard
use, focus indicators and status announcements that aren't excessive.

## Decision

- **Semantics**: a `role="search"` form with a visible `<label>`; cards are `<article>`s in a
  list. Each card uses a _stretched link_ on its title, so the whole card is clickable but
  announced once, by name. Facts use `<dl>`, and pagination is a labelled `<nav>`.
- **Keyboard**: a skip link; visible `:focus-visible` rings everywhere; Escape clears the search;
  the clear button returns focus to the field. After a route change, focus moves to `<main>`
  (query-only changes keep focus where it is).
- **Announcements**: one polite live region, updated only when a request settles ("23 planets
  matching “o”", "0 planets matching “zzz”", "Planets could not be loaded."). It never updates
  per keystroke. Stale results are `inert` and `aria-busy`.
- **Accessible names follow visible text** (WCAG 2.5.3). For example, "Previous" plus a
  visually hidden "page". Storybook's axe check caught the original violation.
- **Motion**: every animation runs under `prefers-reduced-motion: no-preference` only, with a
  global reduce fallback.
- **Responsive**: checked at 375 px and desktop widths, with no horizontal scrolling. Grid
  tracks use `minmax(0, 1fr)` so intrinsic input widths can't push the layout wider.

## Consequences

- Checked by automated tests (labels, focus after clear, announcements, disabled stale paging),
  axe in Storybook, and manual keyboard and mobile passes. A full screen-reader audit across
  platforms was not done.
- The live region stays quiet during typing on purpose. Screen-reader users hear the result
  count once the search has settled.
