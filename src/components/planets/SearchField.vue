<script setup lang="ts">
import { useTemplateRef } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    /** Shows a spinner while results for the typed query are pending. */
    busy?: boolean
  }>(),
  { label: 'Search planets by name', placeholder: 'Tatooine, Hoth, Naboo…', busy: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
}>()

const field = useTemplateRef<HTMLInputElement>('field')

function clear() {
  emit('clear')
  // The clear button disappears once the field is empty; keep the user in the field.
  field.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    event.preventDefault()
    clear()
  }
}

defineExpose({ focus: () => field.value?.focus() })
</script>

<template>
  <form role="search" class="search" @submit.prevent>
    <label class="search__label" for="planet-search">{{ label }}</label>
    <div class="search__box" :class="{ 'is-busy': busy }">
      <svg class="search__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <input
        id="planet-search"
        ref="field"
        class="search__input"
        type="search"
        inputmode="search"
        autocomplete="off"
        spellcheck="false"
        aria-describedby="planet-search-hint"
        :placeholder="placeholder"
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown="onKeydown"
      />
      <span v-if="busy" class="search__spinner" aria-hidden="true" />
      <button
        v-if="modelValue"
        type="button"
        class="search__clear"
        aria-label="Clear search"
        @click="clear"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
    </div>
    <p id="planet-search-hint" class="visually-hidden">
      Results update as you type. Press Escape to clear.
    </p>
  </form>
</template>

<style scoped lang="scss">
.search {
  display: grid;
  gap: var(--space-2);
}

.search__label {
  @include eyebrow;
}

.search__box {
  position: relative;
  display: flex;
  align-items: center;
  @include glass(var(--radius-pill));
  transition:
    border-color var(--duration-fast),
    box-shadow var(--duration-fast);

  &:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 4px var(--color-accent-soft);
  }
}

.search__icon {
  position: absolute;
  left: var(--space-4);
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 1.8;
  stroke-linecap: round;
  pointer-events: none;
}

.search__input {
  flex: 1;
  min-width: 0;
  min-height: 3.25rem;
  padding: 0 var(--space-4) 0 calc(var(--space-4) * 2 + 1.15rem);
  background: transparent;
  border: 0;
  border-radius: inherit;
  outline: none;
  font-size: var(--text-md);

  &::placeholder {
    color: var(--color-text-faint);
  }

  // We render our own accessible clear button.
  &::-webkit-search-cancel-button {
    appearance: none;
  }
}

.search__clear {
  display: grid;
  place-items: center;
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  margin-right: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  background: var(--surface-glass);
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast);
  @include focus-ring(2px);

  &:hover {
    background: var(--surface-glass-hover);
    border-color: var(--border-strong);
  }

  svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }
}

.search__spinner {
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-right: var(--space-3);
  border: 2px solid var(--border-strong);
  border-top-color: var(--color-accent);
  border-radius: 50%;

  @include motion {
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
