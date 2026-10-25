import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PlanetCard from './PlanetCard.vue'
import { films, planetWithoutFilms, tatooine } from '@/stories/samples'

const meta = {
  title: 'Planets/PlanetCard',
  component: PlanetCard,
  args: { planet: tatooine, films: [films[0]!, films[2]!], filmsStatus: 'ready' },
  argTypes: {
    filmsStatus: { control: 'inline-radio', options: ['loading', 'ready', 'failed'] },
  },
  decorators: [
    () => ({ template: '<div style="max-width: 20rem; display: grid"><story /></div>' }),
  ],
} satisfies Meta<typeof PlanetCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Film titles come from a shared catalogue request; until it resolves, chips shimmer. */
export const FilmsLoading: Story = { args: { films: [], filmsStatus: 'loading' } }

/** The catalogue failed: say so instead of implying the planet has no films. */
export const FilmsUnavailable: Story = { args: { films: [], filmsStatus: 'failed' } }

export const NotInAnyFilm: Story = { args: { planet: planetWithoutFilms, films: [] } }
