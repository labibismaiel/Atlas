import type { FilmDto, PagedResponseDto, PersonDto, PlanetDto } from '@/api/swapi.types'

const API = 'https://swapi.dev/api'

export function planetDto(overrides: Partial<PlanetDto> & { id?: number } = {}): PlanetDto {
  const { id = 1, ...rest } = overrides
  return {
    name: 'Tatooine',
    rotation_period: '23',
    orbital_period: '304',
    diameter: '10465',
    climate: 'arid',
    gravity: '1 standard',
    terrain: 'desert',
    surface_water: '1',
    population: '200000',
    residents: [`${API}/people/1/`, `${API}/people/2/`],
    films: [`${API}/films/1/`, `${API}/films/3/`],
    url: `${API}/planets/${id}/`,
    ...rest,
  }
}

export function filmDto(id: number, title: string, episode = id): FilmDto {
  return { title, episode_id: episode, release_date: '1977-05-25', url: `${API}/films/${id}/` }
}

export function personDto(id: number, name: string): PersonDto {
  return { name, url: `${API}/people/${id}/` }
}

export function pagedDto<T>(
  results: T[],
  { count = results.length, next = null, previous = null }: Partial<PagedResponseDto<T>> = {},
): PagedResponseDto<T> {
  return { count, next, previous, results }
}

/** Ten distinct planets, convenient for a "full page". */
export function planetPage(names: string[], meta: Partial<PagedResponseDto<PlanetDto>> = {}) {
  return pagedDto(
    names.map((name, index) => planetDto({ id: index + 1, name })),
    meta,
  )
}

export const FILMS = [
  filmDto(1, 'A New Hope', 4),
  filmDto(2, 'The Empire Strikes Back', 5),
  filmDto(3, 'Return of the Jedi', 6),
]
