import type { Planet } from '@/models'

export type Biome =
  | 'gas'
  | 'urban'
  | 'volcanic'
  | 'frozen'
  | 'ocean'
  | 'arid'
  | 'murky'
  | 'forest'
  | 'temperate'
  | 'rocky'
  | 'unknown'

export interface BiomeStyle {
  label: string
  /** Sphere gradient: lit side → mid tone → shadow side. */
  base: [string, string, string]
  /** Colour of the noise-driven surface pattern (continents, dunes, bands…). */
  surface: string
  /** feTurbulence baseFrequency "x y": stretch x for bands/dunes, raise both for fine detail. */
  frequency: [number, number]
  /** 0–1: how much of the surface the pattern covers. */
  coverage: number
  atmosphere: string | null
  clouds?: string
  polarCaps?: boolean
  /** Emissive layer drawn after shading: lava veins or city lights. */
  glow?: { color: string; kind: 'veins' | 'lights' }
}

interface Rule {
  biome: Exclude<Biome, 'unknown'>
  keywords: string[]
  /** Dominant features ("gas giant", "cityscape") outweigh incidental ones ("mountains"). */
  weight: number
}

// Order doubles as tie-break priority. Keywords match as substrings of SWAPI's
// climate/terrain vocabulary, e.g. "volcano" matches "volcanoes".
const RULES: Rule[] = [
  { biome: 'gas', keywords: ['gas giant'], weight: 5 },
  { biome: 'urban', keywords: ['city', 'cityscape', 'urban', 'polluted'], weight: 3 },
  { biome: 'volcanic', keywords: ['volcan', 'lava', 'magma'], weight: 3 },
  {
    biome: 'frozen',
    keywords: ['frozen', 'frigid', 'ice', 'tundra', 'glacier', 'snow', 'arctic'],
    weight: 2,
  },
  {
    biome: 'ocean',
    keywords: ['ocean', 'sea', 'water', 'reef', 'island'],
    weight: 1.5,
  },
  {
    biome: 'arid',
    keywords: ['arid', 'desert', 'dune', 'mesa', 'canyon', 'savanna', 'scrub', 'hot', 'dry'],
    weight: 1,
  },
  { biome: 'murky', keywords: ['murky', 'swamp', 'bog', 'marsh', 'fung', 'humid'], weight: 1.5 },
  {
    biome: 'forest',
    keywords: ['forest', 'jungle', 'rainforest', 'tropical', 'vine', 'tree'],
    weight: 1.25,
  },
  // Mountains and caves are deliberately absent: almost every planet lists them.
  {
    biome: 'rocky',
    keywords: ['rock', 'barren', 'asteroid', 'airless', 'crater'],
    weight: 1,
  },
  {
    biome: 'temperate',
    keywords: ['temperate', 'grass', 'plain', 'hill', 'field', 'meadow', 'moist'],
    weight: 1,
  },
]

export const BIOMES: Record<Biome, BiomeStyle> = {
  gas: {
    label: 'Gas giant',
    base: ['#f6e2c4', '#c8915f', '#4a2b18'],
    surface: '#9a5f36',
    frequency: [0.0025, 0.055],
    coverage: 0.75,
    atmosphere: '#ffd9b0',
  },
  urban: {
    label: 'Ecumenopolis',
    base: ['#c4c8d2', '#5f6574', '#14171f'],
    surface: '#3a3f4b',
    frequency: [0.07, 0.07],
    coverage: 0.6,
    atmosphere: '#c7d6ff',
    glow: { color: '#ffcf6b', kind: 'lights' },
  },
  volcanic: {
    label: 'Volcanic',
    base: ['#6a544c', '#2b1c18', '#090504'],
    surface: '#140b09',
    frequency: [0.03, 0.03],
    coverage: 0.6,
    atmosphere: '#ff7a3d',
    glow: { color: '#ff5a1f', kind: 'veins' },
  },
  frozen: {
    label: 'Ice world',
    base: ['#ffffff', '#bcd5ea', '#3f5a75'],
    surface: '#e9f4fc',
    frequency: [0.022, 0.03],
    coverage: 0.55,
    atmosphere: '#cfe8ff',
    polarCaps: true,
  },
  ocean: {
    label: 'Ocean world',
    base: ['#86c8ff', '#1d5ca6', '#06173a'],
    surface: '#3aa3dc',
    frequency: [0.02, 0.024],
    coverage: 0.4,
    atmosphere: '#8fd0ff',
    clouds: '#ffffff',
  },
  arid: {
    label: 'Desert',
    base: ['#f5dca8', '#c9934c', '#55361a'],
    surface: '#a5672f',
    frequency: [0.012, 0.045],
    coverage: 0.5,
    atmosphere: '#f6c88a',
  },
  murky: {
    label: 'Swamp',
    base: ['#a3ae84', '#4b5736', '#12180c'],
    surface: '#2f3a22',
    frequency: [0.03, 0.03],
    coverage: 0.55,
    atmosphere: '#c6d4a0',
    clouds: '#cfd8b8',
  },
  forest: {
    label: 'Forest',
    base: ['#b2dc94', '#3e7a3a', '#0d2614'],
    surface: '#24502a',
    frequency: [0.025, 0.03],
    coverage: 0.55,
    atmosphere: '#a8e6ff',
    clouds: '#ffffff',
  },
  temperate: {
    label: 'Temperate',
    base: ['#9cd2f0', '#2f6f9e', '#0b2238'],
    surface: '#6f9b52',
    frequency: [0.018, 0.022],
    coverage: 0.45,
    atmosphere: '#9ed8ff',
    clouds: '#ffffff',
    polarCaps: true,
  },
  rocky: {
    label: 'Barren rock',
    base: ['#d4cfc6', '#7e776e', '#221f1c'],
    surface: '#57514a',
    frequency: [0.04, 0.04],
    coverage: 0.5,
    atmosphere: null,
  },
  unknown: {
    label: 'Uncharted',
    base: ['#c6ccd8', '#697185', '#191d26'],
    surface: '#454c5d',
    frequency: [0.03, 0.03],
    coverage: 0.45,
    atmosphere: '#aab6cc',
  },
}

/** Picks the biome whose keywords best match the planet's climate and terrain. */
export function biomeFor(planet: Pick<Planet, 'climates' | 'terrains'>): Biome {
  const tokens = [...planet.climates, ...planet.terrains].map((token) => token.toLowerCase())
  let best: Biome = 'unknown'
  let bestScore = 0
  for (const rule of RULES) {
    const matches = tokens.filter((token) => rule.keywords.some((k) => token.includes(k))).length
    const score = matches * rule.weight
    if (score > bestScore) {
      best = rule.biome
      bestScore = score
    }
  }
  return best
}

/** FNV-1a: a tiny, stable string hash, so every planet gets its own but repeatable surface. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export interface Appearance extends BiomeStyle {
  biome: Biome
  seed: number
  /** Small per-planet variation of the pattern scale (0.85–1.15). */
  scale: number
  /** Axial tilt in degrees, -20…20. */
  tilt: number
}

export function appearanceFor(planet: Pick<Planet, 'name' | 'climates' | 'terrains'>): Appearance {
  const biome = biomeFor(planet)
  const hash = hashString(planet.name)
  return {
    ...BIOMES[biome],
    biome,
    seed: hash % 10_000,
    scale: 0.85 + ((hash >>> 8) % 31) / 100,
    tilt: ((hash >>> 16) % 41) - 20,
  }
}
