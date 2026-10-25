import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import PaginationNav from './PaginationNav.vue'

const meta = {
  title: 'Planets/PaginationNav',
  component: PaginationNav,
  args: { page: 2, pageCount: 6, hasPrevious: true, hasNext: true, onChange: fn() },
} satisfies Meta<typeof PaginationNav>

export default meta
type Story = StoryObj<typeof meta>

export const MiddlePage: Story = {}

export const FirstPage: Story = { args: { page: 1, hasPrevious: false } }

/** While results are stale (typing, loading), paging is disabled. */
export const Disabled: Story = { args: { disabled: true } }
