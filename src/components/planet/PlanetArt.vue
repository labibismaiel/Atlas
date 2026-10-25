<script setup lang="ts">
import type { Planet } from '@/models'

withDefaults(defineProps<{ planet: Planet; size?: 'sm' | 'lg' }>(), { size: 'sm' })
</script>

<template>
  <div class="art" :class="`art--${size}`" aria-hidden="true" />
</template>

<style scoped lang="scss">
.art {
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #9fb4d6, #22324d 60%, #05070b);
}
</style>
