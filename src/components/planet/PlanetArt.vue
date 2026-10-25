<script setup lang="ts">
import { computed, useId } from 'vue'
import type { Planet } from '@/models'
import { appearanceFor } from './appearance'

const props = withDefaults(
  defineProps<{
    planet: Pick<Planet, 'name' | 'climates' | 'terrains'>
    /** `sm` (cards) uses fewer noise octaves and only rotates on hover; `lg` adds scan lines. */
    size?: 'sm' | 'lg'
  }>(),
  { size: 'sm' },
)

const look = computed(() => appearanceFor(props.planet))
const octaves = computed(() => (props.size === 'lg' ? 5 : 3))

// SVG ids are document-global: every instance needs its own.
const uid = useId()
const id = (name: string) => `${uid}-${name}`
const url = (name: string) => `url(#${id(name)})`

const R = 86 // sphere radius in a 200×200 viewBox, leaving room for the atmosphere glow

const frequency = (fx: number, fy: number, scale = 1) =>
  `${(fx * look.value.scale * scale).toFixed(4)} ${(fy * look.value.scale * scale).toFixed(4)}`

/** Alpha = k·(noise − threshold): higher coverage lowers the threshold. */
const surfaceMatrix = computed(() => {
  const k = 7
  const threshold = 0.62 - 0.25 * look.value.coverage
  return `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${(-k * threshold).toFixed(3)}`
})
</script>

<template>
  <svg
    class="art"
    :class="[`art--${size}`, `art--${look.biome}`]"
    viewBox="0 0 200 200"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <clipPath :id="id('clip')">
        <circle cx="100" cy="100" :r="R" />
      </clipPath>

      <radialGradient :id="id('base')" cx="36%" cy="32%" r="78%">
        <stop offset="0" :stop-color="look.base[0]" />
        <stop offset="0.5" :stop-color="look.base[1]" />
        <stop offset="1" :stop-color="look.base[2]" />
      </radialGradient>

      <!-- Light comes from the upper left, as in the design direction. -->
      <radialGradient :id="id('shade')" cx="34%" cy="30%" r="80%">
        <stop offset="0.35" stop-color="#000" stop-opacity="0" />
        <stop offset="0.7" stop-color="#000" stop-opacity="0.45" />
        <stop offset="0.92" stop-color="#000" stop-opacity="0.88" />
      </radialGradient>

      <radialGradient :id="id('shine')" cx="32%" cy="26%" r="32%">
        <stop offset="0" stop-color="#fff" stop-opacity="0.28" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </radialGradient>

      <radialGradient v-if="look.atmosphere" :id="id('rim')" cx="50%" cy="50%" r="50%">
        <stop offset="0.8" :stop-color="look.atmosphere" stop-opacity="0" />
        <stop offset="0.97" :stop-color="look.atmosphere" stop-opacity="0.55" />
        <stop offset="1" :stop-color="look.atmosphere" stop-opacity="0.15" />
      </radialGradient>

      <!-- Night side only: city lights glow where the sun does not reach. -->
      <radialGradient :id="id('night-gradient')" cx="34%" cy="30%" r="80%">
        <stop offset="0.5" stop-color="#000" />
        <stop offset="0.85" stop-color="#fff" />
      </radialGradient>
      <mask :id="id('night')">
        <circle cx="100" cy="100" :r="R" :fill="url('night-gradient')" />
      </mask>

      <!-- Surface pattern: stitched noise so the tile repeats seamlessly while it rotates. -->
      <filter :id="id('surface')" x="0" y="0" width="1" height="1">
        <feTurbulence
          type="fractalNoise"
          :baseFrequency="frequency(...look.frequency)"
          :numOctaves="octaves"
          :seed="look.seed"
          stitchTiles="stitch"
        />
        <feColorMatrix type="matrix" :values="surfaceMatrix" result="mask" />
        <feFlood :flood-color="look.surface" />
        <feComposite in2="mask" operator="in" />
      </filter>

      <filter v-if="look.clouds" :id="id('clouds')" x="0" y="0" width="1" height="1">
        <feTurbulence
          type="fractalNoise"
          :baseFrequency="frequency(0.014, 0.034)"
          :numOctaves="octaves"
          :seed="look.seed + 7"
          stitchTiles="stitch"
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 0 0 -2.15"
          result="mask"
        />
        <feFlood :flood-color="look.clouds" />
        <feComposite in2="mask" operator="in" />
      </filter>

      <filter v-if="look.glow" :id="id('glow')" x="0" y="0" width="1" height="1">
        <!-- Lava: thin ridges of absolute-value noise. Lights: sparse peaks of fine noise. -->
        <feTurbulence
          :type="look.glow.kind === 'veins' ? 'turbulence' : 'fractalNoise'"
          :baseFrequency="
            look.glow.kind === 'veins' ? frequency(0.03, 0.03) : frequency(0.34, 0.34)
          "
          numOctaves="2"
          :seed="look.seed + 13"
          stitchTiles="stitch"
        />
        <feColorMatrix
          type="matrix"
          :values="
            look.glow.kind === 'veins'
              ? '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -12 0 0 0 1.1'
              : '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  24 0 0 0 -15.4'
          "
          result="mask"
        />
        <feFlood :flood-color="look.glow.color" />
        <feComposite in2="mask" operator="in" />
      </filter>

      <filter :id="id('blur')" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>

      <pattern
        v-if="size === 'lg'"
        :id="id('scan')"
        width="4"
        height="3"
        patternUnits="userSpaceOnUse"
      >
        <rect width="4" height="1" fill="#000" fill-opacity="0.28" />
      </pattern>

      <rect :id="id('tile')" x="0" y="0" width="200" height="200" />
    </defs>

    <circle
      v-if="look.atmosphere"
      class="art__halo"
      cx="100"
      cy="100"
      :r="R + 3"
      :fill="look.atmosphere"
      :filter="url('blur')"
    />

    <g :clip-path="url('clip')">
      <circle cx="100" cy="100" :r="R" :fill="url('base')" />

      <g :transform="`rotate(${look.tilt} 100 100)`">
        <g class="art__spin">
          <use :href="`#${id('tile')}`" :filter="url('surface')" />
          <use :href="`#${id('tile')}`" x="200" :filter="url('surface')" />
        </g>
        <g v-if="look.polarCaps" class="art__caps" :filter="url('blur')">
          <ellipse cx="100" cy="12" rx="70" ry="20" />
          <ellipse cx="100" cy="190" rx="60" ry="16" />
        </g>
        <g v-if="look.clouds" class="art__spin art__spin--clouds">
          <use :href="`#${id('tile')}`" :filter="url('clouds')" />
          <use :href="`#${id('tile')}`" x="200" :filter="url('clouds')" />
        </g>
      </g>

      <circle cx="100" cy="100" :r="R" :fill="url('shade')" />
      <circle cx="100" cy="100" :r="R" :fill="url('shine')" />

      <g
        v-if="look.glow"
        :transform="`rotate(${look.tilt} 100 100)`"
        :mask="look.glow.kind === 'lights' ? url('night') : undefined"
        class="art__glow"
      >
        <g class="art__spin">
          <use :href="`#${id('tile')}`" :filter="url('glow')" />
          <use :href="`#${id('tile')}`" x="200" :filter="url('glow')" />
        </g>
      </g>

      <circle v-if="look.atmosphere" cx="100" cy="100" :r="R" :fill="url('rim')" />
      <rect v-if="size === 'lg'" width="200" height="200" :fill="url('scan')" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
.art {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  // The halo fits inside the viewBox; anything else (the off-screen surface tile) is clipped.
  overflow: hidden;
}

.art__halo {
  opacity: 0.35;
}

.art--lg .art__halo {
  opacity: 0.55;
}

.art__caps {
  fill: #fff;
  opacity: 0.85;
}

.art__glow {
  mix-blend-mode: screen;
}

// One full tile width per cycle makes the surface loop seamlessly.
.art__spin {
  @include motion {
    animation: rotate-surface 90s linear infinite;
  }
}

.art__spin--clouds {
  animation-duration: 60s;
}

// Cards rotate only while hovered (see PlanetCard): ten animated noise filters at once
// would cost more CPU than they are worth.
.art--sm .art__spin {
  animation-play-state: paused;
}

@keyframes rotate-surface {
  to {
    transform: translateX(-200px);
  }
}
</style>
