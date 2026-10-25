import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PlanetArt from './PlanetArt.vue'
import { appearanceFor } from './appearance'
import { biomeSamples, tatooine } from '@/stories/samples'

const meta = {
  title: 'Planet/PlanetArt',
  component: PlanetArt,
  args: { planet: tatooine, size: 'lg' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'lg'] } },
  decorators: [() => ({ template: '<div style="max-width: 22rem"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component:
          'Procedural planet portrait. The biome comes from SWAPI climate + terrain keywords; the ' +
          'planet name seeds the noise so every planet is unique but stable. Decorative (aria-hidden).',
      },
    },
  },
} satisfies Meta<typeof PlanetArt>

export default meta
type Story = StoryObj<typeof meta>

export const Large: Story = {}

export const Small: Story = { args: { size: 'sm' } }

/** Every biome next to each other: the quickest way to review the art direction. */
export const BiomeGallery: Story = {
  decorators: [],
  render: () => ({
    components: { PlanetArt },
    setup: () => ({
      samples: biomeSamples.map((planet) => ({ planet, look: appearanceFor(planet) })),
    }),
    template: `
      <ul style="display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:2rem;list-style:none;padding:0">
        <li v-for="{ planet, look } in samples" :key="planet.id" style="display:grid;gap:.75rem;text-align:center">
          <PlanetArt :planet="planet" size="lg" />
          <span style="font-family:var(--font-display);font-size:.8rem;text-transform:uppercase">{{ planet.name }}</span>
          <span style="color:var(--color-text-muted);font-size:.8rem">{{ look.label }}</span>
        </li>
      </ul>`,
  }),
}
