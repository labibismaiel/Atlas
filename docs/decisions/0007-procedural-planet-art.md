# 0007 · Planet artwork generated from climate and terrain

## Context

The design direction relies on planet imagery, but SWAPI has no images. The community image CDN
that used to fill this gap is gone. Hotlinking random images would be fragile and raises
licensing questions.

## Decision

Draw every planet in SVG, from its own data:

1. **Biome** ([`appearance.ts`](../../src/components/planet/appearance.ts)): weighted keyword
   rules score the planet's climate and terrain words. Dominant features (`gas giant`,
   `cityscape`, `lava`) outweigh incidental ones. Rule order breaks ties. There are 11 biomes:
   gas, urban, volcanic, frozen, ocean, arid, murky, forest, rocky, temperate, unknown.
   Words almost every planet lists (`mountains`, `caves`) are deliberately ignored. The rules
   were checked against real SWAPI values, and those checks are now unit tests.
2. **Per-planet variation**: an FNV-1a hash of the name seeds the noise and nudges its scale
   and the axial tilt. Every planet is unique but looks the same on every visit.
3. **Rendering** ([`PlanetArt.vue`](../../src/components/planet/PlanetArt.vue)): a shaded sphere
   from a radial gradient; a `feTurbulence` surface tinted per biome; optional clouds, polar
   caps, lava veins or city lights on the night side; an atmosphere rim and halo. At the large
   size it adds the scan lines from the detail design reference.
4. **Rotation**: the surface noise uses `stitchTiles`, so a tile drawn twice side by side loops
   seamlessly as it slides. That is a cheap, believable "spin".

## Consequences

- No image requests, no licensing questions, and it works for planets added to the API later.
- Data-driven but impressionistic: this is an artist's impression, not canon. The detail page
  says so ("Artist's impression · Desert").
- SVG filters cost CPU. Cards use 3 noise octaves and **only rotate on hover**. The detail view
  uses 5 octaves and rotates continuously. All motion stops under `prefers-reduced-motion`.
- SVG ids are global to the document, so every instance gets its own prefix from Vue's
  `useId()`. A test checks this.
- The artwork is decorative (`aria-hidden`): the planet's name and facts are right next to it.
