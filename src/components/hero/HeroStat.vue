<script setup lang="ts">
import { computed, toRef, watch } from 'vue'
import { useScrambledNumber } from '@/composables/useScramble'
import { formatInteger } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    label: string
    /** Unknown while loading; the digits shuffle until it arrives. */
    value: number | null
    failed?: boolean
    /** Order in the stat row, so the figures settle one after another. */
    index?: number
  }>(),
  { failed: false, index: 0 },
)

const SEGMENTS = 6

const { display, settled, halt } = useScrambledNumber(toRef(props, 'value'), {
  startDelayMs: 700 + props.index * 180,
})
watch(
  () => props.failed,
  (failed) => failed && halt('n/a'),
  { immediate: true },
)

const spoken = computed(() =>
  props.failed
    ? `${props.label}: unavailable`
    : props.value === null
      ? `${props.label}: loading`
      : `${formatInteger(props.value)} ${props.label.toLowerCase()}`,
)
</script>

<template>
  <div class="stat" :class="{ 'is-settled': settled && !failed, 'is-failed': failed }">
    <dt class="stat__label">{{ label }}</dt>
    <dd class="stat__value">
      <span aria-hidden="true">{{ display }}</span>
      <span class="visually-hidden">{{ spoken }}</span>
    </dd>
    <!-- Charges up segment by segment once the value locks, then a pulse runs along it. -->
    <dd class="stat__meter" aria-hidden="true">
      <i v-for="n in SEGMENTS" :key="n" :style="{ '--i': n - 1 }" />
    </dd>
  </div>
</template>

<style scoped lang="scss">
.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  padding-inline: var(--space-3);
  border-left: 1px solid var(--border-strong);

  @include up(sm) {
    padding-inline: var(--space-5);
  }

  &:first-child {
    padding-left: 0;
    border-left: 0;
  }
}

// Value first visually, label second, while the DOM keeps dt before dd.
.stat__value {
  order: -1;
  margin: 0;
  min-width: 2ch;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 1rem + 1.4vw, 1.9rem);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
  transition: color var(--duration-base);

  .is-settled & {
    color: var(--color-text);
  }
}

.stat__label {
  font-family: var(--font-display);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.stat__meter {
  display: flex;
  gap: 3px;
  margin: var(--space-2) 0 0;

  i {
    width: 10px;
    height: 3px;
    background: rgb(255 255 255 / 0.1);
    transition:
      background 250ms,
      box-shadow 250ms;
    transition-delay: calc(var(--i) * 90ms);

    .is-settled & {
      background: var(--color-accent);
      box-shadow: 0 0 6px rgb(255 216 77 / 0.6);
    }

    @include motion {
      .is-settled & {
        animation: pulse 3.2s ease-in-out infinite;
        animation-delay: calc(900ms + var(--i) * 110ms);
      }
    }
  }
}

@keyframes pulse {
  0%,
  70%,
  100% {
    background: var(--color-accent);
    box-shadow: 0 0 6px rgb(255 216 77 / 0.6);
  }

  80% {
    background: #fff7d1;
    box-shadow: 0 0 10px rgb(255 240 190 / 0.95);
  }
}
</style>
