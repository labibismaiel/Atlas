import { describe, expect, it } from 'vitest'
import { appearanceFor, biomeFor, hashString, type Biome } from '../appearance'

const planet = (climate: string, terrain: string) => ({
  climates: climate.split(', '),
  terrains: terrain.split(', '),
})

describe('biomeFor', () => {
  // Real SWAPI climate/terrain values.
  it.each<[string, string, string, Biome]>([
    ['Tatooine', 'arid', 'desert', 'arid'],
    ['Hoth', 'frozen', 'tundra, ice caves, mountain ranges', 'frozen'],
    ['Kamino', 'temperate', 'ocean', 'ocean'],
    ['Bespin', 'temperate', 'gas giant', 'gas'],
    ['Coruscant', 'temperate', 'cityscape, mountains', 'urban'],
    ['Mustafar', 'hot', 'volcanoes, lava rivers, mountains, caves', 'volcanic'],
    ['Dagobah', 'murky', 'swamp, jungles', 'murky'],
    ['Endor', 'temperate', 'forests, mountains, lakes', 'forest'],
    ['Yavin IV', 'temperate, tropical', 'jungle, rainforests', 'forest'],
    ['Alderaan', 'temperate', 'grasslands, mountains', 'temperate'],
    ['Polis Massa', 'artificial temperate', 'airless asteroid', 'rocky'],
    ['Corellia', 'temperate', 'plains, urban, hills, forests', 'urban'],
  ])('%s is %s', (_name, climate, terrain, biome) => {
    expect(biomeFor(planet(climate, terrain))).toBe(biome)
  })

  it('falls back to unknown when nothing is known', () => {
    expect(biomeFor({ climates: [], terrains: [] })).toBe('unknown')
  })
})

describe('appearanceFor', () => {
  it('is deterministic for the same planet', () => {
    const tatooine = { name: 'Tatooine', climates: ['arid'], terrains: ['desert'] }
    expect(appearanceFor(tatooine)).toEqual(appearanceFor(tatooine))
  })

  it('varies between planets of the same biome', () => {
    const a = appearanceFor({ name: 'Tatooine', climates: ['arid'], terrains: ['desert'] })
    const b = appearanceFor({ name: 'Jakku', climates: ['arid'], terrains: ['desert'] })
    expect(a.biome).toBe(b.biome)
    expect(a.seed).not.toBe(b.seed)
  })

  it('keeps per-planet variation within design bounds', () => {
    for (const name of ['Hoth', 'Naboo', 'Kashyyyk', 'Utapau', 'Mygeeto', 'Felucia']) {
      const look = appearanceFor({ name, climates: [], terrains: [] })
      expect(look.scale).toBeGreaterThanOrEqual(0.85)
      expect(look.scale).toBeLessThanOrEqual(1.15)
      expect(Math.abs(look.tilt)).toBeLessThanOrEqual(20)
    }
  })

  it('hashes strings to stable unsigned integers', () => {
    expect(hashString('Hoth')).toBe(hashString('Hoth'))
    expect(hashString('Hoth')).toBeGreaterThanOrEqual(0)
  })
})
