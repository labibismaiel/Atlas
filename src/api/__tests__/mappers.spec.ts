import { describe, expect, it } from 'vitest'
import { idFromUrl, toList, toNumber, toPage, toPlanet } from '../mappers'
import { pagedDto, planetDto } from '@/test/fixtures'

describe('mappers', () => {
  it('extracts ids from SWAPI resource URLs with or without a trailing slash', () => {
    expect(idFromUrl('https://swapi.dev/api/planets/7/')).toBe('7')
    expect(idFromUrl('https://swapi.dev/api/people/42')).toBe('42')
    expect(() => idFromUrl('https://swapi.dev/api/planets/')).toThrow(
      'Unexpected SWAPI resource URL',
    )
  })

  it('parses numbers and treats unknown values as null', () => {
    expect(toNumber('1000000000000')).toBe(1_000_000_000_000)
    expect(toNumber('1,000')).toBe(1000)
    expect(toNumber('unknown')).toBeNull()
    expect(toNumber('N/A')).toBeNull()
  })

  it('splits comma separated lists and drops unknown entries', () => {
    expect(toList('temperate, tropical')).toEqual(['temperate', 'tropical'])
    expect(toList('unknown')).toEqual([])
  })

  it('maps a planet DTO into the domain model', () => {
    expect(toPlanet(planetDto({ id: 1 }))).toEqual({
      id: '1',
      name: 'Tatooine',
      rotationPeriod: 23,
      orbitalPeriod: 304,
      diameter: 10465,
      climates: ['arid'],
      gravity: '1 standard',
      terrains: ['desert'],
      surfaceWater: 1,
      population: 200000,
      residentIds: ['1', '2'],
      filmIds: ['1', '3'],
    })
  })

  it('treats a zero diameter and unknown gravity as missing data', () => {
    const planet = toPlanet(planetDto({ diameter: '0', gravity: 'N/A' }))
    expect(planet.diameter).toBeNull()
    expect(planet.gravity).toBeNull()
  })

  it('derives pagination from the API metadata, not from the page contents', () => {
    const page = toPage(
      pagedDto([planetDto()], { count: 23, next: 'x?page=3', previous: 'x?page=1' }),
      2,
      toPlanet,
    )
    expect(page).toMatchObject({
      total: 23,
      page: 2,
      pageCount: 3,
      hasNext: true,
      hasPrevious: true,
    })
    expect(page.items).toHaveLength(1)
  })
})
