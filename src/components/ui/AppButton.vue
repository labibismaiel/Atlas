<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'ghost' }>(), { variant: 'ghost' })
</script>

<template>
  <button type="button" class="button" :class="`button--${variant}`">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 2.75rem;
  padding: 0 var(--space-5);
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: var(--text-2xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast),
    opacity var(--duration-fast);
  @include focus-ring;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }
}

.button--primary {
  border: 1px solid transparent;
  background: var(--color-text);
  color: var(--color-bg);

  &:not(:disabled):hover {
    background: var(--color-accent);
  }
}

.button--ghost {
  border: 1px solid var(--border-strong);
  background: transparent;

  &:not(:disabled):hover {
    border-color: var(--color-text);
    background: var(--surface-glass-hover);
  }
}
</style>
