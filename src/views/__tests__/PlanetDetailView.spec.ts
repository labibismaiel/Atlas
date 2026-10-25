import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import PlanetDetailView from '../PlanetDetailView.vue'
import { resetFilmsCache } from '@/composables/useFilms'
import { rememberPlanets, resetPlanetCache } from '@/composables/planetCache'
import { toPlanet } from '@/api/mappers'
import { controlledFetch, flushPromises } from '@/test/fetch'
import { FILMS, pagedDto, personDto, planetDto } from '@/test/fixtures'

let wrapper: VueWrapper | undefined

async function setup(path = '/planets/1', from?: string) {
  const net = controlledFetch()
  const router = createRouter({
    // Web history (jsdom implements it) so history.state.back behaves as in the browser.
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'planets', component: { render: () => null } },
      { path: '/planets/:id', name: 'planet', component: PlanetDetailView, props: true },
    ],
  })
  if (from) await router.push(from)
  await router.push(path)
  await router.isReady()
  wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [router] } })
  await flushPromises()
  return { net, router, wrapper }
}

const text = () => wrapper!.text()

beforeEach(() => {
  resetFilmsCache()
  resetPlanetCache()
  // Start every test as if the page had been opened directly on a planet URL.
  window.history.replaceState(null, '', '/planets/1')
})

afterEach(() => {
  wrapper?.unmount()
})

describe('PlanetDetailView', () => {
  it('shows every field of the planet, its films and its residents', async () => {
    const { net } = await setup()
    await net.to('/films/')[0]!.respond(pagedDto(FILMS))
    await net.to('/planets/1/')[0]!.respond(planetDto({ id: 1 }))
    await net.to('/people/1/')[0]!.respond(personDto(1, 'Luke Skywalker'))
    await net.to('/people/2/')[0]!.respond(personDto(2, 'C-3PO'))

    expect(wrapper!.get('h1').text()).toBe('Tatooine')
    for (const value of [
      'Arid', // climate
      '10,465 km', // diameter
      '1 standard', // gravity
      '200,000 people', // population
      '23 hours', // rotation
      '304 days', // orbit
      '1%', // surface water
      'desert', // terrain
      'A New Hope',
      'Return of the Jedi',
      'Episode IV',
      'Luke Skywalker',
      'C-3PO',
      'Dec 9, 2014',
    ]) {
      expect(text()).toContain(value)
    }
    expect(text()).not.toContain('The Empire Strikes Back')
  })

  it('renders the planet before residents arrive and reports residents that fail', async () => {
    const { net } = await setup()
    await net.to('/planets/1/')[0]!.respond(planetDto({ id: 1 }))
    expect(text()).toContain('Loading residents…')

    await net.to('/people/1/')[0]!.respond(personDto(1, 'Luke Skywalker'))
    await net.to('/people/2/')[0]!.respond({}, 500)
    expect(text()).toContain('Luke Skywalker')
    expect(text()).toContain('1 resident could not be loaded.')
  })

  it('labels unknown values rather than hiding them', async () => {
    const { net } = await setup()
    await net
      .to('/planets/1/')[0]!
      .respond(
        planetDto({ id: 1, population: 'unknown', gravity: 'N/A', residents: [], films: [] }),
      )
    expect(text()).toContain('Unknown')
    expect(text()).toContain('No known residents on record.')
    expect(text()).toContain('Not featured in any film.')
  })

  it('shows a not-found state for an id the archive does not have', async () => {
    const { net } = await setup('/planets/999')
    await net.to('/planets/999/')[0]!.respond({ detail: 'Not found' }, 404)
    expect(wrapper!.get('h1').text()).toBe('This planet is not in the archive')
    expect(wrapper!.find('button').exists()).toBe(false)
  })

  it('shows a recoverable error and retries', async () => {
    const { net } = await setup()
    await net.to('/planets/1/')[0]!.fail()
    expect(text()).toContain('The archive is not responding')

    await wrapper!.get('button').trigger('click')
    await flushPromises()
    await net.to('/planets/1/')[1]!.respond(planetDto({ id: 1 }))
    expect(wrapper!.get('h1').text()).toBe('Tatooine')
  })

  it('aborts the previous planet when navigating to another one', async () => {
    const { net, router } = await setup()
    const first = net.to('/planets/1/')[0]!

    await router.push('/planets/4')
    await flushPromises()
    expect(first.aborted).toBe(true)

    await net.to('/planets/4/')[0]!.respond(planetDto({ id: 4, name: 'Hoth' }))
    expect(wrapper!.get('h1').text()).toBe('Hoth')
  })

  it('links back to the exact list the user came from', async () => {
    await setup('/planets/1', '/?search=tat&page=2')
    expect(wrapper!.get('a').attributes('href')).toBe('/?search=tat&page=2')
  })

  it('links back to the first page when opened directly', async () => {
    await setup('/planets/1')
    expect(wrapper!.get('a').attributes('href')).toBe('/')
  })

  it('renders a planet already shown in the list without requesting it again', async () => {
    rememberPlanets([toPlanet(planetDto({ id: 1 }))])
    const { net } = await setup()

    expect(wrapper!.get('h1').text()).toBe('Tatooine')
    expect(net.to('/planets/')).toHaveLength(0)
    expect(net.to('/people/')).toHaveLength(2) // residents still load
  })
})
