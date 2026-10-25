import { computed, onScopeDispose, ref, watch } from 'vue'
import { fetchCount } from '@/api/swapi'
import { catalogueSize, rememberCatalogueSize } from './planetCache'
import { useFilms } from './useFilms'

/** How long to wait for the list to report the catalogue size before asking SWAPI directly. */
export const CATALOGUE_SIZE_GRACE_MS = 2500

// Residents are counted once per session, like the film catalogue.
let residentsRequest: Promise<number> | null = null

function loadResidentCount(): Promise<number> {
  residentsRequest ??= fetchCount('people').catch((error: unknown) => {
    residentsRequest = null
    throw error
  })
  return residentsRequest
}

/** Test seam. */
export function resetArchiveStats(): void {
  residentsRequest = null
}

export interface ArchiveStat {
  key: 'planets' | 'films' | 'residents'
  label: string
  value: number | null
  failed: boolean
}

/**
 * The three hero figures, all real SWAPI totals:
 * - planets: the catalogue size the list already learned (unfiltered page). Only when the user
 *   landed on a search does it fall back to one count request, after a short grace period.
 * - films: the size of the shared film catalogue.
 * - residents: the `/people/` count, requested once.
 */
export function useArchiveStats() {
  const films = useFilms()
  const residents = ref<number | null>(null)
  const residentsFailed = ref(false)
  const planetsFailed = ref(false)

  loadResidentCount().then(
    (count) => (residents.value = count),
    () => (residentsFailed.value = true),
  )

  const grace = setTimeout(() => {
    if (catalogueSize.value !== null) return
    fetchCount('planets').then(rememberCatalogueSize, () => (planetsFailed.value = true))
  }, CATALOGUE_SIZE_GRACE_MS)
  watch(catalogueSize, (size) => size !== null && clearTimeout(grace))
  onScopeDispose(() => clearTimeout(grace))

  const stats = computed<ArchiveStat[]>(() => [
    {
      key: 'planets',
      label: 'Planets charted',
      value: catalogueSize.value,
      failed: planetsFailed.value && catalogueSize.value === null,
    },
    {
      key: 'films',
      label: 'Films indexed',
      value: films.films.value?.size ?? null,
      failed: films.failed.value,
    },
    {
      key: 'residents',
      label: 'Residents logged',
      value: residents.value,
      failed: residentsFailed.value,
    },
  ])

  const synced = computed(() => stats.value.every((stat) => stat.value !== null))

  return { stats, synced }
}
