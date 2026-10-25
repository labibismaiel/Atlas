import type { Film, Page, Person, Planet } from '@/models'
import { SWAPI_PAGE_SIZE } from './config'
import type { FilmDto, PagedResponseDto, PersonDto, PlanetDto } from './swapi.types'

const UNKNOWN_VALUES = new Set(['', 'unknown', 'n/a', 'none'])

const isUnknown = (value: string) => UNKNOWN_VALUES.has(value.trim().toLowerCase())

/** Resource id from a SWAPI URL, e.g. "https://swapi.dev/api/planets/7/" → "7". */
export function idFromUrl(url: string): string {
  const match = /\/(\d+)\/?$/.exec(url)
  if (!match?.[1]) throw new Error(`Unexpected SWAPI resource URL: ${url}`)
  return match[1]
}

/** "1,000" or "23" → number; "unknown" → null. */
export function toNumber(value: string): number | null {
  if (isUnknown(value)) return null
  const parsed = Number(value.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

/** "temperate, tropical" → ["temperate", "tropical"]; "unknown" → []. */
export function toList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => !isUnknown(item))
}

export function toText(value: string): string | null {
  return isUnknown(value) ? null : value.trim()
}

export function toPlanet(dto: PlanetDto): Planet {
  return {
    id: idFromUrl(dto.url),
    name: dto.name,
    rotationPeriod: toNumber(dto.rotation_period),
    orbitalPeriod: toNumber(dto.orbital_period),
    diameter: toNumber(dto.diameter) || null, // SWAPI uses "0" for unmeasured planets
    climates: toList(dto.climate),
    gravity: toText(dto.gravity),
    terrains: toList(dto.terrain),
    surfaceWater: toNumber(dto.surface_water),
    population: toNumber(dto.population),
    residentIds: dto.residents.map(idFromUrl),
    filmIds: dto.films.map(idFromUrl),
    createdAt: dto.created,
    editedAt: dto.edited,
  }
}

export function toFilm(dto: FilmDto): Film {
  return {
    id: idFromUrl(dto.url),
    title: dto.title,
    episode: dto.episode_id,
    releaseDate: dto.release_date,
  }
}

export function toPerson(dto: PersonDto): Person {
  return { id: idFromUrl(dto.url), name: dto.name }
}

export function toPage<TDto, T>(
  dto: PagedResponseDto<TDto>,
  page: number,
  mapItem: (item: TDto) => T,
): Page<T> {
  return {
    items: dto.results.map(mapItem),
    total: dto.count,
    page,
    pageCount: Math.max(1, Math.ceil(dto.count / SWAPI_PAGE_SIZE)),
    hasNext: dto.next !== null,
    hasPrevious: dto.previous !== null,
  }
}
