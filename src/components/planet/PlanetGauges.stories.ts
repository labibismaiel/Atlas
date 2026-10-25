import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PlanetGauges from './PlanetGauges.vue'

const meta = {
  title: 'Planet/PlanetGauges',
  component: PlanetGauges,
  args: { planet: { diameter: 10465, surfaceWater: 1, population: 200000 } },
  decorators: [
    () => ({ template: '<div style="max-width: 16rem; --tint: #f6c88a"><story /></div>' }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Size (linear, capped at 20,000 km), water (%) and population (log scale) at a glance. ' +
          'Bars take the surrounding `--tint`; unknown values get a dashed track, never a zero.',
      },
    },
  },
} satisfies Meta<typeof PlanetGauges>

export default meta
type Story = StoryObj<typeof meta>

export const Tatooine: Story = {}

export const GasGiant: Story = {
  args: { planet: { diameter: 118000, surfaceWater: 0, population: 6000000 } },
  decorators: [() => ({ template: '<div style="--tint: #ffd9b0"><story /></div>' })],
}

export const Unknown: Story = {
  args: { planet: { diameter: null, surfaceWater: null, population: null } },
}
