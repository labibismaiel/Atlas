<script setup lang="ts">
import { computed } from 'vue'
import { useArchiveStats } from '@/composables/useArchiveStats'
import { useDecodedText } from '@/composables/useScramble'
import { appearanceFor } from '@/components/planet/appearance'
import { prefersReducedMotion } from '@/utils/motion'
import PlanetArt from '@/components/planet/PlanetArt.vue'
import HeroStat from './HeroStat.vue'

// The hero planet is fixed: Tatooine, the first planet in the archive. Its art is generated
// from these fields exactly like the cards; no request is needed to draw it.
const HERO_PLANET = { id: '1', name: 'Tatooine', climates: ['arid'], terrains: ['desert'] }
const look = appearanceFor(HERO_PLANET)

const { stats, synced } = useArchiveStats()
const status = useDecodedText('Holonet archive').display
// SMIL motion ignores prefers-reduced-motion, so the satellites only animate when allowed.
const animateOrbits = !prefersReducedMotion()

const scanLine = computed(() => {
  if (stats.value.some((stat) => stat.failed)) return 'Archive link degraded'
  if (!synced.value) return 'Syncing archive…'
  const [planets, films] = stats.value
  return `Archive synced · ${planets?.value} planets · ${films?.value} films`
})
</script>

<template>
  <section class="hero" aria-labelledby="hero-title" :style="{ '--tint': look.tint }">
    <div class="hero__frame" aria-hidden="true"><i /><i /><i /><i /></div>
    <span class="hero__coords" aria-hidden="true">X 4.21 · Y −0.88 · Z 12.07</span>
    <span class="hero__coords hero__coords--bottom" aria-hidden="true">{{ scanLine }}</span>
    <span class="hero__shooting-star" aria-hidden="true" />

    <div class="hero__text">
      <p class="hero__status">
        <span aria-hidden="true">{{ status }}</span>
        <span class="visually-hidden">Holonet archive</span>
        <span class="hero__live">Online</span>
      </p>
      <h1 id="hero-title" class="hero__title">
        <span class="hero__line"><span>Explore.</span></span>
        <span class="hero__line"><span>Discover.</span></span>
        <span class="hero__line"><span class="hero__accent">Chart.</span></span>
      </h1>
      <p class="hero__lead">
        Every known planet in the Star Wars galaxy, and the films that brought it to the screen.
      </p>
      <dl class="hero__stats">
        <HeroStat
          v-for="(stat, index) in stats"
          :key="stat.key"
          :label="stat.label"
          :value="stat.value"
          :failed="stat.failed"
          :index="index"
        />
      </dl>
    </div>

    <div class="hero__visual">
      <div class="hero__glow" aria-hidden="true" />
      <svg class="hero__dial" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="98" class="hero__dial-ticks" />
      </svg>
      <svg class="hero__dial hero__dial--inner" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="96" class="hero__dial-arc" />
      </svg>
      <svg class="hero__orbits" viewBox="0 0 200 200" aria-hidden="true">
        <g transform="rotate(-18 100 100)">
          <ellipse cx="100" cy="100" rx="96" ry="34" class="hero__orbit" />
          <ellipse cx="100" cy="100" rx="74" ry="24" class="hero__orbit hero__orbit--inner" />
          <circle r="2.2" class="hero__satellite">
            <animateMotion
              v-if="animateOrbits"
              dur="14s"
              repeatCount="indefinite"
              path="M4,100 a96,34 0 1,0 192,0 a96,34 0 1,0 -192,0"
            />
          </circle>
          <circle r="1.4" class="hero__satellite hero__satellite--small">
            <animateMotion
              v-if="animateOrbits"
              dur="9s"
              begin="-4s"
              repeatCount="indefinite"
              path="M26,100 a74,24 0 1,1 148,0 a74,24 0 1,1 -148,0"
            />
          </circle>
        </g>
      </svg>
      <PlanetArt class="hero__planet" :planet="HERO_PLANET" size="lg" />
      <RouterLink :to="{ name: 'planet', params: { id: HERO_PLANET.id } }" class="hero__target">
        <span class="hero__target-label">Target locked</span>
        <span class="hero__target-name">{{ HERO_PLANET.name }}</span>
        <span class="hero__target-meta">{{ look.label }} world</span>
      </RouterLink>
    </div>

    <a href="#results" class="hero__scroll">
      Scroll to explore
      <i aria-hidden="true" />
    </a>
  </section>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  display: grid;
  // minmax(0, …): without it the text column grows to its content and gets clipped on phones.
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
  align-items: center;
  padding-block: var(--space-7) var(--space-8);
  // Decorations bleed past the edges on tablets; clip them without a scroll container.
  overflow: clip;

  @include up(md) {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    padding-block: var(--space-8);
  }
}

// HUD corner brackets
.hero__frame {
  position: absolute;
  inset: var(--space-4) 0;
  pointer-events: none;

  i {
    position: absolute;
    width: 22px;
    height: 22px;
    border: 0 solid var(--border-strong);
  }

  i:nth-child(1) {
    top: 0;
    left: 0;
    border-width: 1px 0 0 1px;
  }

  i:nth-child(2) {
    top: 0;
    right: 0;
    border-width: 1px 1px 0 0;
  }

  i:nth-child(3) {
    bottom: 0;
    left: 0;
    border-width: 0 0 1px 1px;
  }

  i:nth-child(4) {
    right: 0;
    bottom: 0;
    border-width: 0 1px 1px 0;
  }
}

.hero__coords {
  position: absolute;
  top: calc(var(--space-4) + 8px);
  right: var(--space-6);
  display: none;
  font-family: var(--font-display);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-faint);

  @include up(md) {
    display: block;
  }
}

.hero__coords--bottom {
  top: auto;
  right: auto;
  bottom: calc(var(--space-4) + 8px);
  left: var(--space-6);
}

.hero__shooting-star {
  position: absolute;
  top: 18%;
  left: 72%;
  width: 140px;
  height: 1px;
  background: linear-gradient(90deg, #fff, transparent);
  opacity: 0;
  transform: rotate(-24deg);
  pointer-events: none;

  @include motion {
    animation: shoot 11s ease-in 4s infinite;
  }
}

.hero__text {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: start;
  gap: var(--space-4);
}

.hero__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  @include eyebrow;
  color: var(--color-text);
}

.hero__live {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-status);

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
  }
}

.hero__title {
  font-size: clamp(1.9rem, 0.9rem + 5vw, 4.75rem);
  line-height: 1.12;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

// Each line slides up from behind its own mask.
.hero__line {
  display: block;
  overflow: hidden;

  > span {
    display: block;

    @include motion {
      animation: rise 900ms var(--ease-out) both;
    }
  }

  &:nth-child(2) > span {
    animation-delay: 120ms;
  }

  &:nth-child(3) > span {
    animation-delay: 240ms;
  }
}

// The accent word catches a slow sweep of light, the same motif as the card glint.
.hero__accent {
  color: var(--color-accent);

  @include motion {
    background: linear-gradient(
        100deg,
        var(--color-accent) 40%,
        #fff7d1 50%,
        var(--color-accent) 60%
      )
      0 0 / 300% 100%;
    background-clip: text;
    color: transparent;
    animation:
      rise 900ms var(--ease-out) 240ms both,
      sweep 5s ease-in-out 1.4s infinite;
  }
}

.hero__lead {
  max-width: 30rem;
  color: var(--color-text-muted);

  @include motion {
    animation: fade-up 1s var(--ease-out) 500ms both;
  }
}

.hero__stats {
  display: flex;
  margin-top: var(--space-4);

  @include motion {
    animation: fade-up 1s var(--ease-out) 700ms both;
  }
}

.hero__visual {
  position: relative;
  order: -1;
  width: min(62%, 30rem);
  aspect-ratio: 1;
  justify-self: center;

  @include up(md) {
    order: 0;
    width: min(100%, 30rem);
  }
}

.hero__glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--tint) 16%, transparent),
    transparent 62%
  );
}

.hero__dial {
  position: absolute;
  inset: -4%;
  overflow: visible;
  fill: none;

  @include motion {
    animation: spin 80s linear infinite;
  }
}

.hero__dial--inner {
  inset: 6%;
  animation-duration: 50s;
  animation-direction: reverse;
}

.hero__dial-ticks {
  stroke: rgb(255 255 255 / 0.14);
  stroke-width: 0.4;
  stroke-dasharray: 1 3.1;
}

.hero__dial-arc {
  stroke: color-mix(in oklab, var(--color-accent) 35%, transparent);
  stroke-width: 0.6;
  stroke-dasharray: 40 260;
}

.hero__orbits {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.hero__orbit {
  fill: none;
  stroke: rgb(255 255 255 / 0.12);
  stroke-width: 0.5;
}

.hero__orbit--inner {
  stroke: rgb(255 255 255 / 0.08);
}

.hero__satellite {
  fill: var(--tint);
}

.hero__satellite--small {
  fill: var(--color-text);
}

.hero__planet {
  position: absolute;
  inset: 22%;
  width: auto;
}

.hero__target {
  position: absolute;
  top: 12%;
  right: -2%;
  display: grid;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-strong);
  background: rgb(5 7 11 / 0.6);
  backdrop-filter: blur(6px);
  text-decoration: none;
  transition: border-color var(--duration-fast);
  @include focus-ring;

  &:hover {
    border-color: var(--tint);
  }

  @include motion {
    animation: fade-up 1s var(--ease-out) 1s both;
  }
}

.hero__target-label {
  font-family: var(--font-display);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.hero__target-name {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero__target-meta {
  font-size: var(--text-xs);
  color: var(--tint);
}

// Bottom-right of the HUD frame, level with the archive readout on the left.
.hero__scroll {
  position: absolute;
  right: var(--space-6);
  bottom: calc(var(--space-4) + 4px);
  display: none;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-display);
  font-size: 0.5625rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-text-faint);
  text-decoration: none;
  transition: color var(--duration-fast);
  @include focus-ring;

  &:hover {
    color: var(--color-text);
  }

  @include up(md) {
    display: inline-flex;
  }

  i {
    width: 1px;
    height: 18px;
    background: linear-gradient(var(--color-accent), transparent);
    transform-origin: top;

    @include motion {
      animation: drop 2s ease-in-out infinite;
    }
  }
}

@keyframes rise {
  from {
    transform: translateY(105%);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes sweep {
  0%,
  60% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}

@keyframes spin {
  to {
    rotate: 1turn;
  }
}

@keyframes drop {
  0% {
    transform: scaleY(0);
  }

  50% {
    transform: scaleY(1);
  }

  100% {
    transform: scaleY(1);
    opacity: 0;
  }
}

@keyframes shoot {
  0% {
    opacity: 0;
    translate: 0 0;
  }

  2% {
    opacity: 1;
  }

  8%,
  100% {
    opacity: 0;
    translate: -320px 140px;
  }
}
</style>
