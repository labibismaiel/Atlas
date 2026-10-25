import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPlanets } from '@/api/swapi'
import { isAbortError } from '@/api/http'
import type { Page, Planet } from '@/models'
import { createLatestRequest } from '@/utils/latestRequest'
import { normalizeSearch, readPage, readSearch, toListQuery } from '@/utils/query'

export const SEARCH_DEBOUNCE_MS = 300

/**
 * - `loading`: first load, nothing to show yet
 * - `updating`: the query is unsettled or a replacement request is pending; held results are stale
 * - `ready` / `empty`: results for the current query and page
 * - `error`: the current query and page failed and can be retried
 */
export type ListState = 'loading' | 'updating' | 'ready' | 'empty' | 'error'

interface ResolvedPage extends Page<Planet> {
  query: string
}

/**
 * Server-side planet search with pagination, backed by the URL (`?search=&page=`).
 *
 * The URL holds the *committed* query and page. The input text is local and only reaches the
 * URL after {@link SEARCH_DEBOUNCE_MS} of inactivity, so the URL is never a half-typed word.
 * Any change of the URL (typing, paging, back/forward, a pasted link) loads through one path.
 */
export function usePlanetSearch() {
  const route = useRoute()
  const router = useRouter()

  // The route this list lives on; ignore URL changes that are navigations away from it.
  const listPath = route.path
  const query = computed(() => readSearch(route.query))
  const page = computed(() => readPage(route.query))

  const input = ref(query.value)
  const result = shallowRef<ResolvedPage | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const request = createLatestRequest()
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  /** True while the field holds a query that has not been committed (the debounce window). */
  const isTyping = computed(() => normalizeSearch(input.value) !== query.value)

  const isCurrentResult = computed(
    () => result.value?.query === query.value && result.value.page === page.value,
  )

  const state = computed<ListState>(() => {
    if (!isTyping.value && error.value) return 'error'
    if (isTyping.value || loading.value || !isCurrentResult.value) {
      return result.value ? 'updating' : 'loading'
    }
    return result.value?.items.length ? 'ready' : 'empty'
  })

  async function load(search: string, pageNumber: number): Promise<void> {
    const ticket = request.start()
    loading.value = true
    error.value = null
    try {
      const data = await fetchPlanets({ search, page: pageNumber }, { signal: ticket.signal })
      if (!ticket.isCurrent()) return
      result.value = { ...data, query: search }
    } catch (caught) {
      if (!ticket.isCurrent() || isAbortError(caught)) return
      error.value = caught instanceof Error ? caught : new Error(String(caught))
    } finally {
      if (ticket.isCurrent()) loading.value = false
    }
  }

  function cancelDebounce(): void {
    clearTimeout(debounceTimer)
    debounceTimer = undefined
  }

  /** Stop whatever is pending: the debounce timer and the in-flight request. */
  function cancelPending(): void {
    cancelDebounce()
    request.cancel()
    loading.value = false
  }

  /** Move the URL to (search, page), or reload in place when the URL already matches. */
  function commit(search: string, pageNumber: number, history: 'push' | 'replace'): void {
    if (search === query.value && pageNumber === page.value) {
      if (!isCurrentResult.value || error.value || !result.value) void load(search, pageNumber)
      return
    }
    void router[history]({ query: toListQuery(search, pageNumber) })
  }

  function setInput(text: string): void {
    const previous = normalizeSearch(input.value)
    input.value = text
    const next = normalizeSearch(text)
    if (next === previous) return // e.g. a trailing space: same effective query, nothing to do

    // Invalidate immediately: a response for the old query must not land while the user types.
    cancelPending()
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined
      commit(next, 1, 'replace')
    }, SEARCH_DEBOUNCE_MS)
  }

  function clear(): void {
    cancelPending()
    input.value = ''
    commit('', 1, 'replace')
  }

  function goToPage(pageNumber: number): void {
    if (state.value !== 'ready' || pageNumber < 1) return
    commit(query.value, pageNumber, 'push')
  }

  function retry(): void {
    void load(query.value, page.value)
  }

  /** Keep the query, go back to page 1 (e.g. after landing on a page that does not exist). */
  function firstPage(): void {
    commit(query.value, 1, 'replace')
  }

  // Single loading path for every URL change, including the initial render.
  watch(
    [query, page],
    ([search, pageNumber]) => {
      if (route.path !== listPath) return
      // Back/forward or a pasted link: reflect the URL in the field, dropping unsaved typing.
      if (normalizeSearch(input.value) !== search) {
        cancelDebounce()
        input.value = search
      }
      void load(search, pageNumber)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    cancelDebounce()
    request.cancel()
  })

  return {
    /** Raw text of the search field. Change it through {@link setInput}. */
    input: computed(() => input.value),
    /** Committed, normalised query (from the URL). */
    query,
    page,
    state,
    error,
    /** Last successfully resolved page. Check `state` before presenting it as current. */
    result,
    setInput,
    clear,
    goToPage,
    firstPage,
    retry,
  }
}
