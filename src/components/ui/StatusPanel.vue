<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'danger'
    title: string
    /** Heading level so the panel fits the page outline it is placed in. */
    level?: 1 | 2 | 3
  }>(),
  { tone: 'neutral', level: 2 },
)
</script>

<template>
  <div class="panel" :class="`panel--${tone}`">
    <span class="panel__icon" aria-hidden="true">
      <svg v-if="tone === 'danger'" viewBox="0 0 24 24">
        <path d="M12 8v5M12 16.5v.5" />
        <circle cx="12" cy="12" r="9" />
      </svg>
      <svg v-else viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" />
        <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)" />
      </svg>
    </span>
    <component :is="`h${level}`" class="panel__title">{{ title }}</component>
    <div class="panel__body"><slot /></div>
    <div v-if="$slots.actions" class="panel__actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped lang="scss">
.panel {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-5);
  text-align: center;
  @include glass;
}

.panel__icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    fill: none;
    stroke: var(--color-text-muted);
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .panel--danger & {
    border-color: rgb(255 138 122 / 0.35);

    svg {
      stroke: var(--color-danger);
    }
  }
}

.panel__title {
  font-size: var(--text-md);
  letter-spacing: 0.04em;
}

.panel__body {
  max-width: 34rem;
  color: var(--color-text-muted);
}

.panel__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}
</style>
