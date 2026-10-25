<script setup lang="ts">
export interface Fact {
  label: string
  value: string
  /** Visually de-emphasise values SWAPI does not know. */
  unknown?: boolean
}

defineProps<{ facts: Fact[] }>()
</script>

<template>
  <dl class="facts">
    <div v-for="fact in facts" :key="fact.label" class="facts__item">
      <dt class="facts__label">{{ fact.label }}</dt>
      <dd class="facts__value" :class="{ 'is-unknown': fact.unknown }">{{ fact.value }}</dd>
    </div>
  </dl>
</template>

<style scoped lang="scss">
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr));
  gap: var(--space-4) var(--space-5);
}

.facts__item {
  display: grid;
  gap: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.facts__label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text);
  font-size: var(--text-sm);

  // The small square bullet from the design direction.
  &::before {
    content: '';
    width: 4px;
    height: 4px;
    background: var(--color-accent);
  }
}

.facts__value {
  margin: 0;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;

  &.is-unknown {
    color: var(--color-text-faint);
    font-style: italic;
  }
}
</style>
