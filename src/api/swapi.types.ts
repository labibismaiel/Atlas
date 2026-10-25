// Raw response shapes exactly as SWAPI returns them (every scalar is a string).
// Only the fields this app reads are declared. Never used outside src/api.

export interface PagedResponseDto<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PlanetDto {
  name: string
  rotation_period: string
  orbital_period: string
  diameter: string
  climate: string
  gravity: string
  terrain: string
  surface_water: string
  population: string
  residents: string[]
  films: string[]
  url: string
}

export interface FilmDto {
  title: string
  episode_id: number
  release_date: string
  url: string
}

export interface PersonDto {
  name: string
  url: string
}
