import type { Planet } from '@/models'

export interface Gauge {
  key: 'size' | 'water' | 'population'
  label: string
  /** Short display value, e.g. "10.5K km". */
  value: string
  /** Full value for assistive technology, e.g. "10,465 kilometres". */
  description: string
  /** 0–1 fill of the bar, or null when SWAPI does not know the value. */
  ratio: number | null
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('en')

/** Rocky worlds in SWAPI are 4,900–19,720 km across; anything larger (gas giants) fills the bar. */
export const FULL_SIZE_KM = 20_000
/** Coruscant's 1 trillion is the largest population; the scale is logarithmic. */
export const FULL_POPULATION_EXPONENT = 12

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/** Three comparable, at-a-glance measures for a planet card. */
export function planetGauges(
  planet: Pick<Planet, 'diameter' | 'surfaceWater' | 'population'>,
): Gauge[] {
  const { diameter, surfaceWater, population } = planet
  return [
    {
      key: 'size',
      label: 'Size',
      value: diameter === null ? 'n/a' : `${compact.format(diameter)} km`,
      description:
        diameter === null ? 'Diameter unknown' : `${integer.format(diameter)} kilometres across`,
      ratio: diameter === null ? null : clamp(diameter / FULL_SIZE_KM),
    },
    {
      key: 'water',
      label: 'Water',
      value: surfaceWater === null ? 'n/a' : `${surfaceWater}%`,
      description:
        surfaceWater === null
          ? 'Surface water unknown'
          : `${surfaceWater}% of the surface is water`,
      ratio: surfaceWater === null ? null : clamp(surfaceWater / 100),
    },
    {
      key: 'population',
      label: 'People',
      value: population === null ? 'n/a' : compact.format(population),
      description:
        population === null ? 'Population unknown' : `Population ${integer.format(population)}`,
      ratio:
        population === null
          ? null
          : population < 1
            ? 0
            : clamp(Math.log10(population) / FULL_POPULATION_EXPONENT),
    },
  ]
}
