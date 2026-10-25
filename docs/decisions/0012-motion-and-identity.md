# 0012 · Motion and card identity

## Context

Review feedback on the first version: it was correct but generic. Paging felt choppy (cards dimmed
then swapped all at once), and every card was the same grey glass with only the artwork
differing. The brief values UX, and the spec asks for subtle motion that respects
reduced-motion preferences, with no 3D interaction or galaxy visualisation.

## Decision

**Motion: the View Transitions API**, as progressive enhancement
([`viewTransition.ts`](../../src/utils/viewTransition.ts)):

- **List ↔ detail.** A router guard starts a transition before navigating and completes it once
  the new view has rendered. The card's planet art and name have the same
  `view-transition-name` as the detail hero's art and `<h1>`, so they morph between the two
  pages while the rest of the page cross-fades. Text scales uniformly (`object-fit: contain`)
  rather than stretching.
- **Paging and search.** `usePlanetSearch` takes an `applyResult` hook; the list view passes a
  transition. Every card has a name (`card-<id>`) and a class (`card stagger-<n>`), so:
  - cards that leave fade out;
  - new cards rise in one after another;
  - cards present in both result sets (narrowing a search) slide to their new position.

  The search field is excluded from these transitions, so typing never freezes behind a
  snapshot.

- **Making the morph possible:**
  - **Planet cache.** Planets already seen in the list render their detail page immediately,
    so there is a hero to morph into instead of a spinner. It's a small memo; SWAPI data is
    static.
  - **Kept-alive list** ([0003](0003-state-and-url.md)). Going back finds the cards in place.
- **Robustness:**
  - The deferred write re-checks its request ticket, so the race guarantees of
    [0004](0004-search-request-lifecycle.md) still hold.
  - Hidden documents skip the transition.
  - A 1 s deadline applies the update if the browser never runs the transition callback, as in
    a background tab. Data never waits on animation.
  - Aborted or skipped transitions are not errors.

**Identity: each planet's signature colour** (`tint`: its biome's atmosphere colour, from
[0007](0007-procedural-planet-art.md)), exposed as `--tint` and used sparingly:

- on the card: the top hairline, a wash behind the art, the hover border, the "No." label, the
  hover arrow and the gauges;
- on the detail hero: the light behind the planet, the orbit satellites and the glow on the name.

**Ambient loop:** a glint of the planet's colour slowly orbits each card's border (9 s per lap).
It uses a conic gradient driven by a registered `@property` angle and masked to a 1.5 px band.
Each card starts at a different point (offset from its seed), so the grid never pulses in sync.
It is static under reduced motion. Animating a custom property repaints that thin band every
frame, which is cheap at ten cards. A CSS-only loop was chosen over JavaScript or canvas.

**Card interaction:**

- a pointer-following glare ([`usePointerLight`](../../src/composables/usePointerLight.ts):
  CSS variables, one write per frame, mouse and pen only);
- the planet leans up to 6 px towards the pointer;
- a scan line sweeps across the planet on hover.

**Data as design:** [`PlanetGauges`](../../src/components/planet/PlanetGauges.vue) shows size
(linear, capped at 20,000 km so gas giants fill the bar), water (%) and population (log scale,
up to Coruscant's trillion). Values are text with full descriptions for screen readers; the bars
are decorative. Unknown values get a dashed track, never a misleading empty bar.

## Consequences

- No animation library. Browsers without View Transitions, and anyone who prefers reduced
  motion, get the previous instant behaviour. All the logic is still covered by the existing
  tests: jsdom has no View Transitions, so the fallback path runs. The helper itself has its own
  tests (fallback, reduced motion, deadline).
- Transitions animate pre-captured snapshots, so they don't depend on the cost of redrawing the
  SVG noise filters.
- No 3D tilt, galaxy map or other spatial interaction, as the spec asks. The pointer effects
  are 2D light and a few pixels of movement.
- Every card now has `view-transition-name`s. Names must be unique on a page, which holds
  because ids are unique and the kept-alive list is detached from the DOM while a planet is
  open.
