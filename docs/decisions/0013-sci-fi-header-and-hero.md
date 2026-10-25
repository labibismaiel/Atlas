# 0013 · Sci-fi header and hero

## Context

After the cards gained motion and identity ([0012](0012-motion-and-identity.md)), the hero was
the most static part of the page, although it is the first thing users see. The direction was a
sci-fi console look that fits a Star Wars site. It was agreed from an HTML mockup before
building, with two additions requested after the review: numbers that shuffle before settling,
and animated meters under them. A rotating "featured planet" was considered and rejected.

## Decision

**Header** ([`AppHeader`](../../src/components/layout/AppHeader.vue)):

- a brand subtitle;
- three slanted console readouts (sector, node, a live clock), decorative and `aria-hidden`;
- a link indicator showing the real network state (`navigator.onLine`: "Link stable" / "Link
  lost", a polite `role="status"`);
- a bottom edge with a light travelling along it, the same motif as the card glint.

**Hero** ([`HeroSection`](../../src/components/hero/HeroSection.vue)):

- HUD corner brackets; a status label that decodes once from random glyphs;
- the three headline lines rising from their masks, with a slow light sweep across "CHART.";
- Tatooine drawn by the same `PlanetArt` as the cards (fixed, no extra request), inside two
  slowly counter-rotating dials and flat orbits with satellites;
- a "Target locked" readout that links to the planet;
- an occasional shooting star, and a drifting two-layer starfield behind the whole app.

**Stats with real numbers only** ([`useArchiveStats`](../../src/composables/useArchiveStats.ts)):

| Stat             | Source                                                               |
| ---------------- | -------------------------------------------------------------------- |
| Planets charted  | the catalogue size the list already learned from its unfiltered page |
| Films indexed    | the shared film catalogue                                            |
| Residents logged | one `/people/` count request, once per session                       |

The mockup showed "largest population: 1T". It was replaced, because computing it would need
all 60 planets, which the spec rules out (no downloading the whole catalogue).

The planet count deliberately avoids a second, identical `/planets/` request. Only when the user
lands on a search, so the list never sees the unfiltered total, does it ask SWAPI once, after a
2.5 s grace period.

**Shuffle as the loading state** ([`useScramble`](../../src/composables/useScramble.ts)):

- Digits shuffle while a value is unknown, and lock onto it left to right once it arrives,
  after a minimum shuffle of 1.3 s.
- An invented number is never shown as if it were real. A failed stat shows "n/a".
- Screen readers hear only "60 planets charted" (or "loading" / "unavailable"); the shuffling
  digits are `aria-hidden`.
- Each meter charges segment by segment once its number locks, then a pulse runs along it.
  The meters are decorative, a "signal acquired" state rather than a ratio.

## Consequences

- All motion is progressive and off under reduced motion. The SVG satellites use SMIL
  (`animateMotion`), which ignores the media query, so they are only rendered when motion is
  allowed.
- The console readouts (sector, node, coordinates) are flavour text, kept decorative and hidden
  from assistive technology. Everything that looks like data (stats, link status, the "archive
  synced" line) is real.
- The hero adds one request (`/people/` count) per session, plus one planet count only in the
  landed-on-a-search case.
- Grid columns use `minmax(0, 1fr)`, and decorations are clipped with `overflow: clip`. Checked
  at 320–1440 px with no sideways scroll and no clipped text.
