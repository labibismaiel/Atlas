/** SWAPI base URL without a trailing slash. Overridable per environment via `VITE_SWAPI_BASE_URL`. */
export const SWAPI_BASE_URL = (
  import.meta.env.VITE_SWAPI_BASE_URL || 'https://swapi.dev/api'
).replace(/\/+$/, '')

/** SWAPI serves a fixed page size; it is not configurable through the API. */
export const SWAPI_PAGE_SIZE = 10
