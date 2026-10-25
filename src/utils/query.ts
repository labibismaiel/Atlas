import type { LocationQuery, LocationQueryValue } from 'vue-router'

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined

/** First value of a (possibly repeated) query parameter. */
function first(value: QueryValue): string {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? ''
}

/** The effective search: surrounding whitespace is ignored, whitespace-only means "no search". */
export function normalizeSearch(text: string): string {
  return text.trim()
}

export function readSearch(query: LocationQuery): string {
  return normalizeSearch(first(query.search))
}

/** A positive integer page, falling back to 1 for anything missing or malformed. */
export function readPage(query: LocationQuery): number {
  const page = Number(first(query.page))
  return Number.isInteger(page) && page > 1 ? page : 1
}

/** Canonical query object: defaults are omitted so the unfiltered first page is a clean "/". */
export function toListQuery(search: string, page: number): Record<string, string> {
  const query: Record<string, string> = {}
  if (search) query.search = search
  if (page > 1) query.page = String(page)
  return query
}
