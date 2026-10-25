<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

const props = withDefaults(
  defineProps<{
    page: number
    pageCount: number
    hasPrevious: boolean
    hasNext: boolean
    /** Disables both controls, e.g. while the listed results are stale. */
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <nav v-if="pageCount > 1" class="pagination" aria-label="Planet pages">
    <!-- Named by visible text (WCAG 2.5.3 label in name); " page" is for screen readers. -->
    <AppButton :disabled="disabled || !hasPrevious" @click="emit('change', props.page - 1)">
      <span aria-hidden="true">←</span> Previous<span class="visually-hidden"> page</span>
    </AppButton>
    <p class="pagination__status">
      Page <strong>{{ page }}</strong> of {{ pageCount }}
    </p>
    <AppButton :disabled="disabled || !hasNext" @click="emit('change', props.page + 1)">
      Next<span class="visually-hidden"> page</span> <span aria-hidden="true">→</span>
    </AppButton>
  </nav>
</template>

<style scoped lang="scss">
.pagination {
  display: flex;
  flex-wrap: wrap; // very narrow screens: the page status drops below the buttons
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-6);

  @include up(sm) {
    gap: var(--space-4);
  }
}

.pagination__status {
  white-space: nowrap;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-align: center;

  strong {
    color: var(--color-text);
    font-weight: 600;
  }
}
</style>
