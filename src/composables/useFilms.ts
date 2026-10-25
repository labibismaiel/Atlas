import { ref, shallowRef } from 'vue'
import { fetchFilms } from '@/api/swapi'
import type { Film } from '@/models'

// Films are a tiny, static catalogue referenced by every planet. One shared, memoised request
// replaces N per-card requests; a failed request clears the memo so a later call can retry.
let filmsRequest: Promise<Map<string, Film>> | null = null

function loadFilms(): Promise<Map<string, Film>> {
  filmsRequest ??= fetchFilms()
    .then((films) => new Map(films.map((film) => [film.id, film])))
    .catch((error: unknown) => {
      filmsRequest = null
      throw error
    })
  return filmsRequest
}

/** Test seam: forget the memoised catalogue between tests. */
export function resetFilmsCache(): void {
  filmsRequest = null
}

/** Film catalogue lookup, loaded once per session and shared by every component. */
export function useFilms() {
  const films = shallowRef<Map<string, Film> | null>(null)
  const failed = ref(false)

  async function load(): Promise<void> {
    failed.value = false
    try {
      films.value = await loadFilms()
    } catch {
      failed.value = true
    }
  }

  /** Films for the given ids, in release order. Unknown ids are skipped. */
  function filmsFor(ids: string[]): Film[] {
    const catalogue = films.value
    if (!catalogue) return []
    return ids
      .map((id) => catalogue.get(id))
      .filter((film): film is Film => film !== undefined)
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
  }

  void load()

  return { films, failed, filmsFor, retry: load }
}
