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
    <AppButton
      :disabled="disabled || !hasPrevious"
      aria-label="Previous page"
      @click="emit('change', props.page - 1)"
    >
      <span aria-hidden="true">←</span> Prev
    </AppButton>
    <p class="pagination__status">
      Page <strong>{{ page }}</strong> of {{ pageCount }}
    </p>
    <AppButton
      :disabled="disabled || !hasNext"
      aria-label="Next page"
      @click="emit('change', props.page + 1)"
    >
      Next <span aria-hidden="true">→</span>
    </AppButton>
  </nav>
</template>

<style scoped lang="scss">
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.pagination__status {
  min-width: 7rem;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-align: center;

  strong {
    color: var(--color-text);
    font-weight: 600;
  }
}
</style>
