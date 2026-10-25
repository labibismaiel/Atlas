import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { CATALOGUE_SIZE_GRACE_MS, resetArchiveStats, useArchiveStats } from '../useArchiveStats'
import { rememberCatalogueSize, resetPlanetCache } from '../planetCache'
import { resetFilmsCache } from '../useFilms'
import { controlledFetch, flushPromises } from '@/test/fetch'
import { FILMS, pagedDto } from '@/test/fixtures'

const inScope = () => effectScope().run(() => useArchiveStats())!
const statOf = (archive: ReturnType<typeof useArchiveStats>, key: string) =>
  archive.stats.value.find((stat) => stat.key === key)

beforeEach(() => {
  vi.useFakeTimers()
  resetArchiveStats()
  resetPlanetCache()
  resetFilmsCache()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useArchiveStats', () => {
  it('reports real totals: catalogue size, film count and resident count', async () => {
    const net = controlledFetch()
    const archive = inScope()
    await net.to('/films/')[0]!.respond(pagedDto(FILMS))
    await net.to('/people/')[0]!.respond(pagedDto([], { count: 82 }))
    rememberCatalogueSize(60)
    await flushPromises()

    expect(statOf(archive, 'planets')?.value).toBe(60)
    expect(statOf(archive, 'films')?.value).toBe(3)
    expect(statOf(archive, 'residents')?.value).toBe(82)
    expect(archive.synced.value).toBe(true)
  })

  it('reuses the catalogue size from the list instead of requesting it again', async () => {
    const net = controlledFetch()
    inScope()
    rememberCatalogueSize(60)
    await vi.advanceTimersByTimeAsync(CATALOGUE_SIZE_GRACE_MS * 2)
    expect(net.to('/planets/')).toHaveLength(0)
  })

  it('asks SWAPI for the planet count only if the list never reported it', async () => {
    const net = controlledFetch()
    const archive = inScope()
    await vi.advanceTimersByTimeAsync(CATALOGUE_SIZE_GRACE_MS)
    expect(net.to('/planets/')).toHaveLength(1)

    await net.to('/planets/')[0]!.respond(pagedDto([], { count: 60 }))
    expect(statOf(archive, 'planets')?.value).toBe(60)
  })

  it('counts residents once per session', () => {
    const net = controlledFetch()
    inScope()
    inScope()
    expect(net.to('/people/')).toHaveLength(1)
  })

  it('marks a stat as failed instead of inventing a value', async () => {
    const net = controlledFetch()
    const archive = inScope()
    await net.to('/people/')[0]!.fail()
    expect(statOf(archive, 'residents')).toMatchObject({ value: null, failed: true })
  })
})
