import { describe, expect, it } from 'vitest'
import { describePlanet } from '../describePlanet'
import { toPlanet } from '@/api/mappers'
import { planetDto } from '@/test/fixtures'

describe('describePlanet', () => {
  it('summarises the known facts', () => {
    expect(describePlanet(toPlanet(planetDto()))).toBe(
      'Tatooine is an arid world of desert, 10,465 km across. It has a 23-hour day and a 304-day year. Around 200,000 people call it home.',
    )
  })

  it('leaves out unknown values instead of guessing', () => {
    const planet = toPlanet(
      planetDto({
        name: 'Umbara',
        climate: 'unknown',
        terrain: 'unknown',
        diameter: 'unknown',
        rotation_period: 'unknown',
        orbital_period: 'unknown',
        population: 'unknown',
      }),
    )
    expect(describePlanet(planet)).toBe('Umbara is a world.')
  })

  it('joins several terrains naturally', () => {
    const planet = toPlanet(
      planetDto({
        name: 'Naboo',
        climate: 'temperate',
        terrain: 'grassy hills, swamps, forests, mountains',
      }),
    )
    expect(describePlanet(planet)).toContain(
      'a temperate world of grassy hills, swamps and forests',
    )
  })
})
