import '@fontsource/michroma'
import '@fontsource-variable/source-sans-3'
import '../src/styles/main.scss'

import { setup, type Preview } from '@storybook/vue3-vite'
import { createMemoryHistory, createRouter } from 'vue-router'

// Components render <RouterLink>; a memory router with the app's route names is enough.
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'planets', component: { render: () => null } },
    { path: '/planets/:id', name: 'planet', component: { render: () => null } },
  ],
})

setup((app) => {
  app.use(router)
})

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true }, // the app's own dark background comes from main.scss
    controls: { expanded: true },
    a11y: { test: 'error' },
  },
}

export default preview
