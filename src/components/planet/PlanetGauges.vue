<script setup lang="ts">
import { computed } from 'vue'
import type { Planet } from '@/models'
import { planetGauges } from './gauges'

const props = defineProps<{ planet: Pick<Planet, 'diameter' | 'surfaceWater' | 'population'> }>()

const gauges = computed(() => planetGauges(props.planet))
</script>

<template>
  <!-- Bars use the surrounding --tint; values are text, the bars are decoration. -->
  <dl class="gauges">
    <div v-for="gauge in gauges" :key="gauge.key" class="gauge">
      <dt class="gauge__label">{{ gauge.label }}</dt>
      <dd class="gauge__value" :class="{ 'is-unknown': gauge.ratio === null }">
        <span aria-hidden="true">{{ gauge.value }}</span>
        <span class="visually-hidden">{{ gauge.description }}</span>
      </dd>
      <dd class="gauge__track" :class="{ 'is-unknown': gauge.ratio === null }" aria-hidden="true">
        <span class="gauge__fill" :style="{ '--ratio': gauge.ratio ?? 0 }" />
      </dd>
    </div>
  </dl>
</template>

<style scoped lang="scss">
.gauges {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.gauge {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.gauge__label {
  font-family: var(--font-display);
  font-size: 0.5625rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.gauge__value {
  margin: 0;
  overflow: hidden;
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-unknown {
    color: var(--color-text-faint);
  }
}

.gauge__track {
  position: relative;
  height: 3px;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 0.08);

  &.is-unknown {
    background: repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.12) 0 3px,
      transparent 3px 6px
    );
  }
}

.gauge__fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--tint, var(--color-accent)) 35%, transparent),
    var(--tint, var(--color-accent))
  );
  box-shadow: 0 0 8px color-mix(in oklab, var(--tint, var(--color-accent)) 60%, transparent);
  transform: scaleX(var(--ratio));
  transform-origin: left;
}
</style>
