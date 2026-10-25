import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { fetchPerson, fetchPlanet } from '@/api/swapi'
import { ApiError, isAbortError } from '@/api/http'
import type { Person, Planet } from '@/models'
import { createLatestRequest, type RequestTicket } from '@/utils/latestRequest'

export type PlanetState = 'loading' | 'ready' | 'not-found' | 'error'

/**
 * One planet plus the names of its residents. Changing `id` (e.g. navigating between planets
 * while the view is reused) aborts everything still pending for the previous planet.
 */
export function usePlanet(id: Ref<string>) {
  const planet = shallowRef<Planet | null>(null)
  const state = ref<PlanetState>('loading')
  const error = ref<Error | null>(null)

  /** `null` while loading. Residents that failed to load are counted, not silently dropped. */
  const residents = shallowRef<Person[] | null>(null)
  const missingResidents = ref(0)

  const request = createLatestRequest()

  async function loadResidents(ids: string[], ticket: RequestTicket): Promise<void> {
    const results = await Promise.allSettled(
      ids.map((residentId) => fetchPerson(residentId, { signal: ticket.signal })),
    )
    if (!ticket.isCurrent()) return
    residents.value = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
    missingResidents.value = results.filter(
      (r) => r.status === 'rejected' && !isAbortError(r.reason),
    ).length
  }

  async function load(): Promise<void> {
    const ticket = request.start()
    state.value = 'loading'
    error.value = null
    planet.value = null
    residents.value = null
    missingResidents.value = 0
    try {
      const data = await fetchPlanet(id.value, { signal: ticket.signal })
      if (!ticket.isCurrent()) return
      planet.value = data
      state.value = 'ready'
      // Residents are secondary: the page renders now and the names fill in when they arrive.
      void loadResidents(data.residentIds, ticket)
    } catch (caught) {
      if (!ticket.isCurrent() || isAbortError(caught)) return
      const notFound = caught instanceof ApiError && caught.kind === 'not-found'
      state.value = notFound ? 'not-found' : 'error'
      error.value = caught instanceof Error ? caught : new Error(String(caught))
    }
  }

  watch(id, load, { immediate: true })
  onScopeDispose(request.cancel)

  return { planet, state, error, residents, missingResidents, retry: load }
}
