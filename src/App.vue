<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="app">
    <AppHeader />
    <main id="main" class="app__main" tabindex="-1">
      <RouterView />
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
