const integer = new Intl.NumberFormat('en')

/** "23 planets", "1 planet". */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${integer.format(count)} ${count === 1 ? singular : plural}`
}

export function formatInteger(value: number): string {
  return integer.format(value)
}

const compactLong = new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'long' })

/** Prose-friendly: 200000 stays "200,000", 1000000000000 becomes "1 trillion". */
export function formatReadable(value: number): string {
  return value >= 1_000_000 ? compactLong.format(value) : integer.format(value)
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
