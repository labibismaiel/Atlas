import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { resetFilmsCache, useFilms } from '../useFilms'
import { controlledFetch, flushPromises } from '@/test/fetch'
import { FILMS, pagedDto } from '@/test/fixtures'

const inScope = () => effectScope().run(() => useFilms())!

beforeEach(() => {
  resetFilmsCache()
})

describe('useFilms', () => {
  it('shares one catalogue request between every consumer', async () => {
    const net = controlledFetch()
    const first = inScope()
    const second = inScope()
    expect(net.requests).toHaveLength(1)

    await net.last.respond(pagedDto(FILMS))
    expect(first.filmsFor(['3', '1']).map((film) => film.title)).toEqual([
      'A New Hope',
      'Return of the Jedi',
    ])
    expect(second.films.value?.size).toBe(3)
  })

  it('skips unknown ids', async () => {
    const net = controlledFetch()
    const films = inScope()
    await net.last.respond(pagedDto(FILMS))
    expect(films.filmsFor(['99', '2'])).toHaveLength(1)
  })

  it('reports a failure and can retry with a fresh request', async () => {
    const net = controlledFetch()
    const films = inScope()
    await net.last.fail()
    expect(films.failed.value).toBe(true)

    void films.retry()
    await flushPromises()
    expect(net.requests).toHaveLength(2)
    await net.last.respond(pagedDto(FILMS))
    expect(films.failed.value).toBe(false)
    expect(films.films.value?.size).toBe(3)
  })
})
