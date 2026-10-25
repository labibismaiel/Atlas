// SWAPI service layer: the only module that knows endpoints and raw response shapes.
// Every function returns domain models and accepts an AbortSignal so callers own cancellation.
import type { Film, Page, Person, Planet } from '@/models'
import { SWAPI_BASE_URL } from './config'
import { getJson, type RequestOptions } from './http'
import { toFilm, toPage, toPerson, toPlanet } from './mappers'
import type { FilmDto, PagedResponseDto, PersonDto, PlanetDto } from './swapi.types'

export interface PlanetQuery {
  /** Already-normalised search text; empty string means "no filter". */
  search?: string
  page?: number
}

/** Builds the planets list URL. Exported for tests; parameters are encoded by URLSearchParams. */
export function planetsUrl({ search = '', page = 1 }: PlanetQuery = {}): string {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `${SWAPI_BASE_URL}/planets/${query ? `?${query}` : ''}`
}

/** One page of planets, optionally filtered server-side by name via SWAPI's `search` parameter. */
export async function fetchPlanets(
  query: PlanetQuery = {},
  options?: RequestOptions,
): Promise<Page<Planet>> {
  const dto = await getJson<PagedResponseDto<PlanetDto>>(planetsUrl(query), options)
  return toPage(dto, query.page ?? 1, toPlanet)
}

export async function fetchPlanet(id: string, options?: RequestOptions): Promise<Planet> {
  return toPlanet(await getJson<PlanetDto>(`${SWAPI_BASE_URL}/planets/${id}/`, options))
}

/** Every film. Follows `next` defensively, although the catalogue currently fits on one page. */
export async function fetchFilms(options?: RequestOptions): Promise<Film[]> {
  const films: Film[] = []
  let url: string | null = `${SWAPI_BASE_URL}/films/`
  while (url) {
    const dto: PagedResponseDto<FilmDto> = await getJson(url, options)
    films.push(...dto.results.map(toFilm))
    url = dto.next
  }
  return films
}

/** Total number of records in a SWAPI collection, from the first page's `count`. */
export async function fetchCount(
  resource: 'planets' | 'people',
  options?: RequestOptions,
): Promise<number> {
  const dto = await getJson<PagedResponseDto<unknown>>(`${SWAPI_BASE_URL}/${resource}/`, options)
  return dto.count
}

// Related resources are requested by id against the configured base URL rather than by the
// absolute URL SWAPI embeds, so a mirror or proxy set in VITE_SWAPI_BASE_URL is honoured.
export async function fetchPerson(id: string, options?: RequestOptions): Promise<Person> {
  return toPerson(await getJson<PersonDto>(`${SWAPI_BASE_URL}/people/${id}/`, options))
}
