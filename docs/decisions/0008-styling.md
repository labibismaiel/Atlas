# 0008 · Styling: Sass + CSS custom properties, no UI framework

## Context

The brief mentions Sass. The design direction (see `docs/design/`) is a dark, glassy, restrained
space UI that no component library provides as-is.

## Decision

- **Design tokens as CSS custom properties** in
  [`_tokens.scss`](../../src/styles/_tokens.scss): colours, type scale, spacing, radii, motion.
  They are readable at runtime and easy to theme.
- **Sass for authoring helpers only**: breakpoints (`up(md)`, mobile-first), `focus-ring`,
  `glass`, `eyebrow`, `motion` (no-preference only) and `visually-hidden`. They are injected into
  every component with `additionalData`. They emit no CSS by themselves, so nothing is
  duplicated.
- **Scoped component styles** with BEM-ish class names, and a small global reset in `main.scss`.
- One accent colour (yellow, used sparingly for actions, focus and highlights), plus green only
  for "online" status. Everything else is greys on near-black.
- Layout uses intrinsic CSS: `auto-fill/minmax` card grids, `clamp()` type, and a container query
  for the planet name on the detail view so long names never break mid-word.

## Consequences

- No Tailwind or Vuetify: the look is custom, and the stylesheet stays small (~6.5 kB gzipped
  in total).
- The design references are a direction, not a spec: the hero, glass cards, eyebrow labels,
  orbit rings, square bullets and scan lines are borrowed, while the decorative dashboard widgets
  that have no real data behind them are left out.
- The faint text colour was raised to meet WCAG AA contrast on the background.
