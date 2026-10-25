import type { Meta, StoryObj } from '@storybook/vue3-vite'
import StatusPanel from './StatusPanel.vue'
import AppButton from './AppButton.vue'

const meta = {
  title: 'UI/StatusPanel',
  component: StatusPanel,
  args: { title: 'No planets match “zzz”', tone: 'neutral' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'danger'] } },
  render: (args) => ({
    components: { StatusPanel, AppButton },
    setup: () => ({ args }),
    template: `
      <StatusPanel v-bind="args">
        <p>{{ args.tone === 'danger' ? 'The server responded with an error (503).' : 'Check the spelling, or try part of a name.' }}</p>
        <template #actions>
          <AppButton variant="primary">{{ args.tone === 'danger' ? 'Retry' : 'Clear search' }}</AppButton>
        </template>
      </StatusPanel>`,
  }),
} satisfies Meta<typeof StatusPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Zero matches is a successful answer, presented neutrally. */
export const Empty: Story = {}

/** A genuine failure, always with a way to recover. */
export const Failure: Story = { args: { tone: 'danger', title: 'The archive is not responding' } }
