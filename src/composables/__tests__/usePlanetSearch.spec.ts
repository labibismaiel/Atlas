import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { SEARCH_DEBOUNCE_MS, usePlanetSearch } from '../usePlanetSearch'
import { controlledFetch, flushPromises } from '@/test/fetch'
import { planetPage } from '@/test/fixtures'

type Search = ReturnType<typeof usePlanetSearch>

const TEN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

async function setup(path = '/', fetchOptions?: Parameters<typeof controlledFetch>[0]) {
  const net = controlledFetch(fetchOptions)
  let search: Search | undefined
  const Harness = defineComponent({
    setup() {
      search = usePlanetSearch()
      return () => null
    },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Harness },
      { path: '/planets/:id', component: { render: () => null } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [router] } })
  await flushPromises()
  if (!search) throw new Error('Harness did not mount')
  return { net, router, wrapper, search }
}

/** Type and let the debounce elapse. */
async function type(search: Search, text: string) {
  search.setInput(text)
  await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
  await flushPromises()
}

const planetRequests = (net: ReturnType<typeof controlledFetch>) => net.to('/planets/')

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('usePlanetSearch', () => {
  describe('debounce', () => {
    it('waits 300ms after the last keystroke and requests only the latest query', async () => {
      const { net, search } = await setup()
      await net.last.respond(planetPage(TEN, { count: 60 }))
      expect(planetRequests(net)).toHaveLength(1)

      search.setInput('h')
      await vi.advanceTimersByTimeAsync(100)
      search.setInput('ho')
      await vi.advanceTimersByTimeAsync(100)
      search.setInput('hot')
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 1)
      expect(planetRequests(net)).toHaveLength(1)

      await vi.advanceTimersByTimeAsync(1)
      await flushPromises()
      expect(planetRequests(net)).toHaveLength(2)
      expect(net.last.url).toBe('https://swapi.dev/api/planets/?search=hot')
    })

    it('does not refetch for input that normalises to the same query', async () => {
      const { net, search } = await setup('/?search=hoth')
      await net.last.respond(planetPage(['Hoth']))

      await type(search, '  hoth  ')
      expect(planetRequests(net)).toHaveLength(1)
      expect(search.state.value).toBe('ready')
    })
  })

  describe('server-side search parameter', () => {
    it('trims the query and encodes it in the request and the URL', async () => {
      const { net, router, search } = await setup()
      await net.last.respond(planetPage(TEN))

      await type(search, '  tat & oo  ')
      expect(net.last.url).toBe('https://swapi.dev/api/planets/?search=tat+%26+oo')
      expect(router.currentRoute.value.query).toEqual({ search: 'tat & oo' })
    })

    it('treats whitespace-only input as no search', async () => {
      const { net, router, search } = await setup('/?search=ho')
      await net.last.respond(planetPage(['Hoth']))

      await type(search, '   ')
      expect(net.last.url).toBe('https://swapi.dev/api/planets/')
      expect(router.currentRoute.value.query).toEqual({})
    })

    it('never sends a request for whitespace typed into an empty field', async () => {
      const { net, search } = await setup()
      await net.last.respond(planetPage(TEN))

      await type(search, '   ')
      expect(planetRequests(net)).toHaveLength(1)
    })
  })

  describe('results', () => {
    it('exposes the server response and its total count, not the page length', async () => {
      const { net, search } = await setup()
      await net.last.respond(planetPage(TEN, { count: 60 }))

      await type(search, 'o')
      await net.last.respond(planetPage(['Hoth', 'Dagobah'], { count: 23, next: 'n' }))

      expect(search.state.value).toBe('ready')
      expect(search.result.value?.items.map((p) => p.name)).toEqual(['Hoth', 'Dagobah'])
      expect(search.result.value).toMatchObject({ total: 23, query: 'o', pageCount: 3 })
    })
  })

  describe('pagination', () => {
    it('resets to page 1 when the query changes and keeps the query when paging', async () => {
      const { net, router, search } = await setup('/?search=o&page=2')
      expect(net.last.url).toBe('https://swapi.dev/api/planets/?search=o&page=2')
      await net.last.respond(planetPage(TEN, { count: 30, next: 'n', previous: 'p' }))

      await type(search, 'oo')
      expect(net.last.url).toBe('https://swapi.dev/api/planets/?search=oo')
      expect(search.page.value).toBe(1)
      await net.last.respond(planetPage(TEN, { count: 30, next: 'n' }))

      search.goToPage(2)
      await flushPromises()
      expect(net.last.url).toBe('https://swapi.dev/api/planets/?search=oo&page=2')
      expect(router.currentRoute.value.query).toEqual({ search: 'oo', page: '2' })
    })

    it('ignores page changes while results are stale', async () => {
      const { net, search } = await setup()
      await net.last.respond(planetPage(TEN, { count: 30, next: 'n' }))

      search.setInput('x')
      search.goToPage(2)
      await flushPromises()
      expect(planetRequests(net)).toHaveLength(1)
    })

    it('reflects back/forward navigation in the field', async () => {
      const { net, router, search } = await setup()
      await net.last.respond(planetPage(TEN))
      await type(search, 'hoth')
      await net.last.respond(planetPage(['Hoth']))

      await router.replace('/?search=tatooine')
      await flushPromises()
      expect(search.input.value).toBe('tatooine')
      expect(net.last.url).toBe('https://swapi.dev/api/planets/?search=tatooine')
    })
  })

  describe('clear', () => {
    it('cancels the pending debounce and restores unfiltered page 1 immediately', async () => {
      const { net, router, search } = await setup('/?search=ho&page=2')
      await net.last.respond(planetPage(['Hoth'], { count: 11, previous: 'p' }))

      search.setInput('hot')
      search.clear()
      await flushPromises()

      expect(search.input.value).toBe('')
      expect(router.currentRoute.value.query).toEqual({})
      expect(net.last.url).toBe('https://swapi.dev/api/planets/')
      const count = planetRequests(net).length

      // The old timer must not fire and re-apply "hot".
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS * 3)
      expect(planetRequests(net)).toHaveLength(count)
      expect(router.currentRoute.value.query).toEqual({})
    })

    it('aborts the in-flight search request', async () => {
      const { net, search } = await setup()
      await net.last.respond(planetPage(TEN))
      await type(search, 'hoth')
      const inFlight = net.last

      search.clear()
      await flushPromises()

      expect(inFlight.aborted).toBe(true)
      expect(net.last.url).toBe('https://swapi.dev/api/planets/')
      await net.last.respond(planetPage(TEN, { count: 60 }))
      expect(search.state.value).toBe('ready')
      expect(search.result.value).toMatchObject({ query: '', total: 60 })
    })
  })

  describe('cancellation and stale responses', () => {
    it('aborts the in-flight request as soon as the query changes, before the debounce ends', async () => {
      const { net, search } = await setup()
      const initial = net.last

      search.setInput('h')
      expect(initial.aborted).toBe(true)
      await initial.respond(planetPage(TEN)) // too late, already rejected with AbortError
      expect(search.error.value).toBeNull()
      expect(search.state.value).toBe('loading')
    })

    it('ignores a late success, error and finally from a superseded request', async () => {
      const { net, search } = await setup('/', { honourAbort: false })
      await net.last.respond(planetPage(TEN, { count: 60 }))

      await type(search, 'a')
      const first = net.last
      await type(search, 'b')
      const second = net.last

      await first.respond(planetPage(['Alderaan'], { count: 1 }))
      expect(search.state.value).toBe('updating') // second is still loading
      expect(search.result.value?.query).toBe('')

      await second.respond(planetPage(['Bespin'], { count: 1 }))
      await first.fail(new Error('late failure'))
      expect(search.state.value).toBe('ready')
      expect(search.result.value?.items.map((p) => p.name)).toEqual(['Bespin'])
      expect(search.error.value).toBeNull()
    })

    it('ignores a response that lands during the debounce window of a newer query', async () => {
      const { net, search } = await setup('/', { honourAbort: false })
      await net.last.respond(planetPage(TEN, { count: 60 }))
      await type(search, 'a')
      const inFlight = net.last

      search.setInput('ab')
      await inFlight.respond(planetPage(['Alderaan'], { count: 1 }))
      await inFlight.fail()

      expect(search.state.value).toBe('updating')
      expect(search.result.value?.query).toBe('')
      expect(search.error.value).toBeNull()
    })

    it('treats AbortError as expected cancellation, not as a failure', async () => {
      const { net, search } = await setup()
      await net.last.fail(new DOMException('aborted', 'AbortError'))
      expect(search.error.value).toBeNull()
      expect(search.state.value).not.toBe('error')
    })
  })

  describe('states', () => {
    it('moves from loading to empty for a successful response without matches', async () => {
      const { net, search } = await setup('/?search=zzz')
      expect(search.state.value).toBe('loading')
      await net.last.respond(planetPage([], { count: 0 }))
      expect(search.state.value).toBe('empty')
    })

    it('reports a genuine failure as an error, distinct from zero matches', async () => {
      const { net, search } = await setup('/?search=ho')
      await net.last.respond({ detail: 'boom' }, 503)
      expect(search.state.value).toBe('error')
      expect(search.error.value).toMatchObject({ kind: 'http', status: 503 })
    })

    it('retries the current query and page', async () => {
      const { net, search } = await setup('/?search=ho&page=2')
      await net.last.fail()
      expect(search.state.value).toBe('error')

      search.retry()
      expect(search.state.value).toBe('loading')
      await flushPromises()
      expect(net.last.url).toBe('https://swapi.dev/api/planets/?search=ho&page=2')
      await net.last.respond(planetPage(['Hoth'], { count: 11, previous: 'p' }))
      expect(search.state.value).toBe('ready')
    })
  })

  describe('cleanup', () => {
    it('clears the timer and aborts the request on unmount', async () => {
      const { net, wrapper, search } = await setup()
      const inFlight = net.last
      search.setInput('hoth')
      expect(vi.getTimerCount()).toBe(1)

      wrapper.unmount()

      expect(vi.getTimerCount()).toBe(0)
      expect(inFlight.aborted).toBe(true)
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS * 2)
      expect(planetRequests(net)).toHaveLength(1)
    })

    it('aborts a request that is in flight when the component unmounts', async () => {
      const { net, wrapper, search } = await setup()
      await net.last.respond(planetPage(TEN))
      await type(search, 'hoth')
      const inFlight = net.last

      wrapper.unmount()
      expect(inFlight.aborted).toBe(true)
    })
  })
})
