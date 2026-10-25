<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()
const main = useTemplateRef<HTMLElement>('main')

// SPA navigation does not move focus like a page load does. After a page change, move it to
// the content so keyboard and screen reader users start there. Query-only changes (search,
// paging) keep focus where it is.
watch(
  () => route.path,
  async (_path, previous) => {
    if (previous === undefined) return
    await nextTick()
    main.value?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <div class="starfield" aria-hidden="true" />
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="app">
    <AppHeader />
    <main id="main" ref="main" class="app__main" tabindex="-1">
      <!-- The list stays alive while a planet is open: Back restores it instantly, at the same
           scroll position, and its cards are there for the detail → list morph. -->
      <RouterView v-slot="{ Component }">
        <KeepAlive include="PlanetsView">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
    <AppFooter />
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.app__main {
  flex: 1;
  width: 100%;
  max-width: var(--container);
  margin-inline: auto;
  padding-inline: var(--gutter);
  outline: none;
}

.skip-link {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 100;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-bg);
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);

  &:focus-visible {
    transform: none;
    outline: none;
  }
}
</style>
