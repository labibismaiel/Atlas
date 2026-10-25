// Domain models used by the UI. Values SWAPI reports as "unknown"/"n/a" are `null`,
// numbers are numbers, and lists are arrays, so components never parse strings.

export interface Planet {
  id: string
  name: string
  /** Hours in one day. */
  rotationPeriod: number | null
  /** Days in one year. */
  orbitalPeriod: number | null
  /** Kilometres. */
  diameter: number | null
  climates: string[]
  /** Free text, e.g. "1 standard" or "0.85". */
  gravity: string | null
  terrains: string[]
  /** Percentage of the surface covered by water, 0–100. */
  surfaceWater: number | null
  population: number | null
  residentIds: string[]
  filmIds: string[]
}

export interface Film {
  id: string
  title: string
  episode: number
  releaseDate: string
}

export interface Person {
  id: string
  name: string
}

export interface Page<T> {
  items: T[]
  /** Total matches across all pages, as reported by the API. */
  total: number
  page: number
  pageCount: number
  hasNext: boolean
  hasPrevious: boolean
}
