import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchFilms, fetchPerson, fetchPlanet, fetchPlanets, planetsUrl } from '../swapi'
import { ApiError, isAbortError, REQUEST_TIMEOUT_MS } from '../http'
import { filmDto, pagedDto, personDto, planetDto, planetPage } from '@/test/fixtures'
import { controlledFetch, jsonResponse } from '@/test/fetch'

function stubFetch(...responses: Array<Response | Error | DOMException>) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const response of responses) {
    if (response instanceof Response) fetchMock.mockResolvedValueOnce(response)
    else fetchMock.mockRejectedValueOnce(response)
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('planetsUrl', () => {
  it('omits search and page when they are the defaults', () => {
    expect(planetsUrl()).toBe('https://swapi.dev/api/planets/')
    expect(planetsUrl({ search: '', page: 1 })).toBe('https://swapi.dev/api/planets/')
  })

  it('encodes the search parameter and keeps the page', () => {
    expect(planetsUrl({ search: 'tat & oo/ine', page: 2 })).toBe(
      'https://swapi.dev/api/planets/?search=tat+%26+oo%2Fine&page=2',
    )
  })
})

describe('swapi service', () => {
  it('requests planets server-side and maps the page', async () => {
    const fetchMock = stubFetch(jsonResponse(planetPage(['Hoth'], { count: 1 })))

    const page = await fetchPlanets({ search: 'hoth' })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://swapi.dev/api/planets/?search=hoth')
    expect(page.items.map((planet) => planet.name)).toEqual(['Hoth'])
    expect(page.total).toBe(1)
  })

  it('fetches a single planet by id', async () => {
    const fetchMock = stubFetch(jsonResponse(planetDto({ id: 4, name: 'Hoth' })))
    const planet = await fetchPlanet('4')
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://swapi.dev/api/planets/4/')
    expect(planet).toMatchObject({ id: '4', name: 'Hoth' })
  })

  it('follows film pagination until there is no next page', async () => {
    stubFetch(
      jsonResponse(
        pagedDto([filmDto(1, 'A New Hope')], { next: 'https://swapi.dev/api/films/?page=2' }),
      ),
      jsonResponse(pagedDto([filmDto(2, 'The Empire Strikes Back')])),
    )
    const films = await fetchFilms()
    expect(films.map((film) => film.title)).toEqual(['A New Hope', 'The Empire Strikes Back'])
  })

  it('fetches people by id against the configured base URL', async () => {
    const fetchMock = stubFetch(jsonResponse(personDto(1, 'Luke Skywalker')))
    expect(await fetchPerson('1')).toEqual({ id: '1', name: 'Luke Skywalker' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://swapi.dev/api/people/1/')
  })

  it.each([
    [jsonResponse({ detail: 'Not found' }, 404), 'not-found'],
    [jsonResponse({}, 503), 'http'],
    [new TypeError('Failed to fetch'), 'network'],
    [new Response('<html>', { status: 200 }), 'parse'],
  ] as const)('normalises failures into ApiError (%#)', async (response, kind) => {
    stubFetch(response)
    await expect(fetchPlanet('1')).rejects.toMatchObject({ name: 'ApiError', kind })
  })

  it('rethrows cancellation untouched instead of wrapping it', async () => {
    stubFetch(new DOMException('aborted', 'AbortError'))
    const error = await fetchPlanets().catch((e: unknown) => e)
    expect(isAbortError(error)).toBe(true)
    expect(error).not.toBeInstanceOf(ApiError)
  })
})

describe('request lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('propagates the caller abort to the underlying request', async () => {
    const net = controlledFetch()
    const controller = new AbortController()
    const pending = fetchPlanets({}, { signal: controller.signal }).catch((e: unknown) => e)

    controller.abort()

    expect(net.last.aborted).toBe(true)
    expect(isAbortError(await pending)).toBe(true)
  })

  it('gives up after the timeout with a retryable ApiError, not an AbortError', async () => {
    vi.useFakeTimers()
    const net = controlledFetch()
    const pending = fetchPlanets().catch((e: unknown) => e)

    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS)

    expect(net.last.aborted).toBe(true)
    expect(await pending).toMatchObject({ name: 'ApiError', kind: 'timeout' })
  })

  it('leaves no timer behind once a request settles', async () => {
    vi.useFakeTimers()
    const net = controlledFetch()
    const pending = fetchPlanets()
    expect(vi.getTimerCount()).toBe(1)
    await net.last.respond(planetPage(['Hoth']))
    await pending
    expect(vi.getTimerCount()).toBe(0)
  })
})
