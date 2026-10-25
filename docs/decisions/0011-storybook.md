# 0011 · Storybook, kept small

## Context

Storybook is optional for this brief. It is worth adding only if it helps a reviewer judge the UI
faster than clicking around a live API.

## Decision

Add Storybook 10 (`@storybook/vue3-vite`) for **presentational components only**, with just two
addons:

- **docs** (autodocs from props and JSDoc), and
- **a11y** (axe on every story). It caught a real issue: pagination buttons whose
  `aria-label` didn't contain their visible text.

Stories live next to their components:

- `PlanetArt` — includes a **biome gallery**, the quickest way to review the generated art
- `PlanetCard` — film loading, unavailable and none
- `SearchField` — empty, with text, busy, and an interactive playground
- `PaginationNav`, `StatusPanel`

Storybook reuses `vite.config.ts` (aliases, Sass injection), minus the Vue DevTools plugin.

## Consequences

- The components can show every state, such as errors and loading, without breaking the API.
- Left out on purpose: the Vitest browser-mode addon (it brings in Playwright), Chromatic or any
  visual-regression service, interaction tests, and stories for container views. Views depend on
  the network and are covered by integration tests instead ([0010](0010-testing.md)).
- It adds dev dependencies only; nothing ships to users.
