import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { fn } from 'storybook/test'
import SearchField from './SearchField.vue'

const meta = {
  title: 'Planets/SearchField',
  component: SearchField,
  args: { modelValue: '', busy: false, 'onUpdate:modelValue': fn(), onClear: fn() },
  decorators: [() => ({ template: '<div style="max-width: 28rem"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled, presentational search input. Debouncing and requests live in ' +
          '`usePlanetSearch`; this only emits text and a clear intent, and keeps focus on clear.',
      },
    },
  },
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithQuery: Story = { args: { modelValue: 'hoth' } }

/** Shown while the typed query is waiting for its results. */
export const Busy: Story = { args: { modelValue: 'tat', busy: true } }

/** Fully interactive: type, clear with the button or Escape. */
export const Playground: Story = {
  render: (args) => ({
    components: { SearchField },
    setup: () => ({ args, text: ref('') }),
    template: '<SearchField v-bind="args" v-model="text" @clear="text = \'\'" />',
  }),
}
