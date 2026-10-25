import type { StorybookConfig } from '@storybook/vue3-vite'
import type { PluginOption } from 'vite'

const isDevtools = (plugin: PluginOption) =>
  !!plugin && 'name' in plugin && plugin.name.startsWith('vite-plugin-vue-devtools')

// Stories live next to the presentational components they document.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/vue3-vite',
  // Reuses vite.config.ts (aliases, Sass injection) minus Vue DevTools, whose overlay button
  // would otherwise show up in every story and in the accessibility report.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: (viteConfig.plugins ?? []).flat().filter((plugin) => !isDevtools(plugin)),
  }),
}

export default config
