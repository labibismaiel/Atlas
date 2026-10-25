import type { Planet } from '@/models'
import { formatInteger } from './format'

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')

function joinWords(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

/**
 * A short prose summary assembled only from the data SWAPI provides, so the detail page reads
 * like an archive entry without inventing lore. Unknown values are left out, not guessed.
 */
export function describePlanet(planet: Planet): string {
  const sentences: string[] = []

  const climate = planet.climates[0]
  const lead = climate
    ? `${planet.name} is ${article(climate)} ${climate} world`
    : `${planet.name} is a world`
  const terrain = planet.terrains.length ? ` of ${joinWords(planet.terrains.slice(0, 3))}` : ''
  const size = planet.diameter ? `, ${formatInteger(planet.diameter)} km across` : ''
  sentences.push(`${lead}${terrain}${size}.`)

  const cycle = [
    planet.rotationPeriod && `a ${formatInteger(planet.rotationPeriod)}-hour day`,
    planet.orbitalPeriod && `a ${formatInteger(planet.orbitalPeriod)}-day year`,
  ].filter(Boolean)
  if (cycle.length) sentences.push(`It has ${cycle.join(' and ')}.`)

  if (planet.population) {
    sentences.push(`Around ${formatInteger(planet.population)} people call it home.`)
  } else if (planet.population === 0) {
    sentences.push('No permanent population is recorded.')
  }

  return sentences.join(' ')
}
