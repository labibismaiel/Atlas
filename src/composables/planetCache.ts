import type { Planet } from '@/models'

// Planets already shown in the list, by id. Opening one renders its detail page immediately
// (no spinner), which is also what lets the card morph into the detail hero. SWAPI data is
// static, so entries never go stale during a session; at most ~60 small objects are kept.
const planets = new Map<string, Planet>()

export function rememberPlanets(items: Planet[]): void {
  for (const planet of items) planets.set(planet.id, planet)
}

export function cachedPlanet(id: string): Planet | undefined {
  return planets.get(id)
}

/** Test seam: forget remembered planets between tests. */
export function resetPlanetCache(): void {
  planets.clear()
}
