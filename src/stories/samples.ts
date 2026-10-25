// Domain-model samples for stories, built from the same fixtures the tests use.
import { toFilm, toPlanet } from '@/api/mappers'
import { FILMS, planetDto } from '@/test/fixtures'
import type { Planet } from '@/models'

export const films = FILMS.map(toFilm)

export const tatooine: Planet = toPlanet(planetDto({ id: 1 }))

export const planetWithoutFilms: Planet = toPlanet(
  planetDto({ id: 28, name: 'Unknown', climate: 'unknown', terrain: 'unknown', films: [] }),
)

/** One real SWAPI planet per biome, by climate and terrain. */
export const biomeSamples: Planet[] = [
  ['Tatooine', 'arid', 'desert'],
  ['Hoth', 'frozen', 'tundra, ice caves, mountain ranges'],
  ['Kamino', 'temperate', 'ocean'],
  ['Alderaan', 'temperate', 'grasslands, mountains'],
  ['Endor', 'temperate', 'forests, mountains, lakes'],
  ['Dagobah', 'murky', 'swamp, jungles'],
  ['Bespin', 'temperate', 'gas giant'],
  ['Coruscant', 'temperate', 'cityscape, mountains'],
  ['Mustafar', 'hot', 'volcanoes, lava rivers, mountains, caves'],
  ['Polis Massa', 'artificial temperate', 'airless asteroid'],
  ['Umbara', 'unknown', 'unknown'],
].map(([name, climate, terrain], index) =>
  toPlanet(planetDto({ id: index + 1, name, climate, terrain })),
)
