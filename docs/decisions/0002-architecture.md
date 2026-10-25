# 0002 · Layers: service → mappers → composables → views

## Context

SWAPI returns every scalar as a string (`"unknown"`, `"1,000"`, `"0"` for an unmeasured
diameter) and links related resources by absolute URL. If components parsed that themselves, the
parsing would be repeated everywhere and the components would be hard to test.

## Decision

Four thin layers, each with one job:

```
src/api/          Service layer. The only code that knows endpoints and raw DTO shapes.
  http.ts         getJson(): fetch, timeout, error normalisation (ApiError), abort passthrough
  swapi.ts        fetchPlanets / fetchPlanet / fetchFilms / fetchPerson → domain models
  mappers.ts      Adapter: DTO → model ("unknown" → null, strings → numbers/arrays, URL → id)
src/models/       Domain types the UI works with (Planet, Film, Person, Page<T>)
src/composables/  Stateful logic: usePlanetSearch, usePlanet, useFilms
src/components/   Presentational components: props in, events out, no fetching
src/views/        Containers: wire composables to components, own page-level layout
src/utils/        Pure helpers (formatting, query parsing, latest-request guard)
```

Patterns used, and why each is justified here:

- **Service layer + adapter (mapper).** The API's quirks stop at `src/api`. Mappers are pure
  functions, so they are unit-tested without a DOM.
- **Composables.** This is Vue 3's standard way to reuse stateful logic. Each one owns its own
  cancellation and cleanup (`onScopeDispose`).
- **Container / presentational split.** Views fetch data, and components only render it. This
  lets every presentational component appear in Storybook with plain props
  ([0011](0011-storybook.md)).
- **Lookup table, not branching**, for planet biomes ([0007](0007-procedural-planet-art.md)).

## Consequences

- There are no classes, DI container or repository interfaces. With one data source, an
  abstraction to swap it out would never be used. Tests replace `fetch` itself instead.
- Related resources are requested by **id against the configured base URL**, not by the
  absolute URL SWAPI embeds. That way `VITE_SWAPI_BASE_URL` (a mirror or proxy) applies to every
  request.
- Components are grouped by feature (`planets/` for the list, `planet/` for a single planet,
  `ui/` for generic pieces), not by type.
