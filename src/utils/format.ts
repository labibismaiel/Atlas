const integer = new Intl.NumberFormat('en')
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** "23 planets", "1 planet". */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${integer.format(count)} ${count === 1 ? singular : plural}`
}

export function formatInteger(value: number): string {
  return integer.format(value)
}

/** 1000000000 → "1B". Used where space is tight. */
export function formatCompact(value: number): string {
  return compact.format(value)
}

/** Value with a unit, or a dash-free fallback for data SWAPI does not know. */
export function withUnit(value: number | null, unit: string, fallback = 'Unknown'): string {
  return value === null ? fallback : `${integer.format(value)} ${unit}`
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** ["arid", "temperate"] → "Arid, temperate". */
export function formatList(items: string[], fallback = 'Unknown'): string {
  return items.length ? capitalize(items.join(', ')) : fallback
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

export function episodeLabel(episode: number): string {
  return `Episode ${ROMAN[episode] ?? episode}`
}
