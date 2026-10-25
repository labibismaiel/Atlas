import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HeroStat from './HeroStat.vue'

const meta = {
  title: 'Hero/HeroStat',
  component: HeroStat,
  args: { label: 'Planets charted', value: 60, failed: false },
  // HeroStat renders a dt/dd pair, so it lives inside a <dl>.
  decorators: [() => ({ template: '<dl style="display: flex"><story /></dl>' })],
  parameters: {
    docs: {
      description: {
        component:
          'Digits shuffle while the value is unknown (the shuffle is the loading state), then ' +
          'lock left to right onto the real value; the meter charges up and a pulse runs along it. ' +
          'Screen readers only hear the real value or its loading/unavailable state.',
      },
    },
  },
} satisfies Meta<typeof HeroStat>

export default meta
type Story = StoryObj<typeof meta>

export const Settles: Story = {}

/** Still waiting for SWAPI: the digits keep shuffling. */
export const Loading: Story = { args: { value: null } }

export const Unavailable: Story = { args: { value: null, failed: true, label: 'Residents logged' } }
