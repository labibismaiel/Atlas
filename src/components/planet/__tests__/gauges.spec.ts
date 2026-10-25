import { describe, expect, it } from 'vitest'
import { planetGauges } from '../gauges'

const gauges = (diameter: number | null, surfaceWater: number | null, population: number | null) =>
  Object.fromEntries(planetGauges({ diameter, surfaceWater, population }).map((g) => [g.key, g]))

describe('planetGauges', () => {
  it('formats compact values with full descriptions for screen readers', () => {
    const { size, water, population } = gauges(10465, 1, 200000)
    expect(size).toMatchObject({ value: '10.5K km', description: '10,465 kilometres across' })
    expect(water).toMatchObject({ value: '1%', ratio: 0.01 })
    expect(population).toMatchObject({ value: '200K', description: 'Population 200,000' })
  })

  it('scales size linearly and caps giants at a full bar', () => {
    expect(gauges(10000, 0, 0).size?.ratio).toBe(0.5)
    expect(gauges(118000, 0, 0).size?.ratio).toBe(1) // Bespin
  })

  it('scales population logarithmically', () => {
    expect(gauges(1, 1, 1_000_000_000_000).population?.ratio).toBe(1) // Coruscant
    expect(gauges(1, 1, 1_000_000).population?.ratio).toBe(0.5)
    expect(gauges(1, 1, 0).population?.ratio).toBe(0)
  })

  it('marks unknown values instead of drawing an empty bar as zero', () => {
    const { size, water, population } = gauges(null, null, null)
    for (const gauge of [size, water, population]) {
      expect(gauge).toMatchObject({ value: 'n/a', ratio: null })
    }
  })
})
