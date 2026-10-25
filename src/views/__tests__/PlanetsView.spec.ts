import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import PlanetsView from '../PlanetsView.vue'
import { SEARCH_DEBOUNCE_MS } from '@/composables/usePlanetSearch'
import { resetFilmsCache } from '@/composables/useFilms'
import { controlledFetch, flushPromises } from '@/test/fetch'
import { FILMS, pagedDto, planetDto, planetPage } from '@/test/fixtures'

const TEN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
let wrapper: VueWrapper | undefined

async function setup(path = '/') {
  const net = controlledFetch()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'planets', component: PlanetsView },
      { path: '/planets/:id', name: 'planet', component: { render: () => null } },
    ],
  })
  await router.push(path)
  await router.isReady()
  wrapper = mount(
    { render: () => h(RouterView) },
    {
      global: { plugins: [router] },
      attachTo: document.body,
    },
  )
  await flushPromises()
  await net.to('/films/')[0]?.respond(pagedDto(FILMS))
  const planets = () => net.to('/planets/')
  return { net, router, wrapper, planets, lastPlanets: () => planets().at(-1)! }
}

const input = () => wrapper!.get<HTMLInputElement>('input[type="search"]')
const cardNames = () => wrapper!.findAll('.card__name').map((node) => node.text())
const count = () => wrapper!.get('.toolbar__count').text()
const liveRegion = () => wrapper!.get('[role="status"]').text()

async function typeAndSettle(text: string) {
  await input().setValue(text)
  await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers()
  resetFilmsCache()
})

afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
})

describe('PlanetsView', () => {
  it('lists planets with the titles of the films they appear in', async () => {
    const { lastPlanets } = await setup()
    await lastPlanets().respond(
      pagedDto([planetDto({ id: 1, name: 'Tatooine', films: ['https://swapi.dev/api/films/1/'] })]),
    )

    expect(cardNames()).toEqual(['Tatooine'])
    expect(wrapper!.get('.card').text()).toContain('A New Hope')
    expect(wrapper!.get('.card a').attributes('href')).toBe('/planets/1')
  })

  it('has a labelled search field above the cards', async () => {
    const { lastPlanets } = await setup()
    await lastPlanets().respond(planetPage(TEN))
    const label = wrapper!.get('label[for="planet-search"]')
    expect(label.text()).toBe('Search planets by name')
    expect(wrapper!.find('[role="search"]').exists()).toBe(true)
  })

  it('replaces the cards with the search response and shows the API total', async () => {
    const { lastPlanets } = await setup()
    await lastPlanets().respond(planetPage(TEN, { count: 60, next: 'n' }))
    expect(count()).toBe('60 planets charted')

    await typeAndSettle('o')
    await lastPlanets().respond(planetPage(['Hoth', 'Dagobah'], { count: 23, next: 'n' }))

    expect(cardNames()).toEqual(['Hoth', 'Dagobah'])
    expect(count()).toBe('23 planets matching “o”')
    expect(liveRegion()).toBe('23 planets matching “o”')
    expect(wrapper!.text()).toContain('Page 1 of 3')
  })

  it('uses singular wording for exactly one match', async () => {
    const { lastPlanets } = await setup('/?search=hoth')
    await lastPlanets().respond(planetPage(['Hoth'], { count: 1 }))
    expect(count()).toBe('1 planet matching “hoth”')
  })

  it('marks old results as updating while the new query is unsettled', async () => {
    const { lastPlanets } = await setup()
    await lastPlanets().respond(planetPage(TEN, { count: 60, next: 'n' }))

    await input().setValue('hot')

    expect(count()).toBe('Searching…')
    expect(liveRegion()).toBe('')
    expect(wrapper!.get('ul.grid').attributes('aria-busy')).toBe('true')
    expect(wrapper!.text()).toContain('Updating results…')
    expect(wrapper!.get('button[aria-label="Next page"]').attributes('disabled')).toBeDefined()
  })

  it('shows skeletons while the first page loads', async () => {
    await setup()
    expect(wrapper!.findAll('.skeleton')).toHaveLength(6)
    expect(count()).toBe('Scanning the galaxy…')
  })

  it('shows an empty state for zero matches with a way to clear the search', async () => {
    const { lastPlanets } = await setup('/?search=zzz')
    await lastPlanets().respond(planetPage([], { count: 0 }))

    expect(wrapper!.text()).toContain('No planets match “zzz”')
    expect(liveRegion()).toBe('0 planets matching “zzz”')

    await wrapper!.get('.panel button').trigger('click')
    await flushPromises()
    expect(lastPlanets().url).toBe('https://swapi.dev/api/planets/')
    expect(input().element.value).toBe('')
    expect(document.activeElement).toBe(input().element)
  })

  it('shows a recoverable error, never zero matches, and retries the current query', async () => {
    const { lastPlanets, planets } = await setup('/?search=ho&page=2')
    await lastPlanets().respond({}, 500)

    expect(wrapper!.text()).toContain('The archive is not responding')
    expect(wrapper!.text()).not.toContain('No planets match')
    expect(count()).toBe('Results unavailable')

    await wrapper!.get('.panel button').trigger('click')
    await flushPromises()
    expect(planets()).toHaveLength(2)
    expect(lastPlanets().url).toBe('https://swapi.dev/api/planets/?search=ho&page=2')

    await lastPlanets().respond(planetPage(['Hoth'], { count: 11, previous: 'p' }))
    expect(cardNames()).toEqual(['Hoth'])
  })

  it('offers an accessible clear control only when there is text, and keeps focus', async () => {
    const { lastPlanets } = await setup()
    await lastPlanets().respond(planetPage(TEN))
    expect(wrapper!.find('button[aria-label="Clear search"]').exists()).toBe(false)

    await typeAndSettle('hoth')
    await lastPlanets().respond(planetPage(['Hoth'], { count: 1 }))
    input().element.focus()

    await wrapper!.get('button[aria-label="Clear search"]').trigger('click')
    await flushPromises()

    expect(input().element.value).toBe('')
    expect(document.activeElement).toBe(input().element)
    expect(lastPlanets().url).toBe('https://swapi.dev/api/planets/')
  })

  it('clears with the Escape key', async () => {
    const { lastPlanets } = await setup('/?search=hoth')
    await lastPlanets().respond(planetPage(['Hoth'], { count: 1 }))

    await input().trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(input().element.value).toBe('')
    expect(lastPlanets().url).toBe('https://swapi.dev/api/planets/')
  })

  it('pages with the active query preserved', async () => {
    const { lastPlanets, router } = await setup('/?search=o')
    await lastPlanets().respond(planetPage(TEN, { count: 23, next: 'n' }))

    await wrapper!.get('button[aria-label="Next page"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ search: 'o', page: '2' })
    expect(lastPlanets().url).toBe('https://swapi.dev/api/planets/?search=o&page=2')
  })
})
