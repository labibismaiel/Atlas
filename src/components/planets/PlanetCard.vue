<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import type { Film, Planet } from '@/models'
import { formatList } from '@/utils/format'
import { appearanceFor } from '@/components/planet/appearance'
import { usePointerLight } from '@/composables/usePointerLight'
import PlanetArt from '@/components/planet/PlanetArt.vue'
import PlanetGauges from '@/components/planet/PlanetGauges.vue'

const props = defineProps<{
  planet: Planet
  films: Film[]
  /** Catalogue status, so a missing title list is never mistaken for "no films". */
  filmsStatus: 'loading' | 'ready' | 'failed'
}>()

const headingId = computed(() => `planet-${props.planet.id}-name`)

// Each card takes its planet's signature colour: border, glow, gauges and hover light.
const look = computed(() => appearanceFor(props.planet))

const RING_PERIOD_MS = 9000
const cardStyle = computed(() => ({
  '--tint': look.value.tint,
  // Start each card's light at a different point of its orbit, so the grid never pulses in sync.
  '--ring-delay': `-${look.value.seed % RING_PERIOD_MS}ms`,
  '--ring-period': `${RING_PERIOD_MS}ms`,
}))

usePointerLight(useTemplateRef<HTMLElement>('card'))
</script>

<template>
  <article ref="card" class="card" :aria-labelledby="headingId" :style="cardStyle">
    <span class="card__ring" aria-hidden="true" />
    <span class="card__glare" aria-hidden="true" />
    <header class="card__top">
      <span class="card__index">No. {{ planet.id.padStart(2, '0') }}</span>
      <span class="card__climate">{{ formatList(planet.climates) }}</span>
    </header>

    <!-- Shared-element names: the art and name morph into the detail page's hero. -->
    <div class="card__visual">
      <PlanetArt
        class="card__art"
        :planet="planet"
        size="sm"
        :style="{ viewTransitionName: `planet-art-${planet.id}` }"
      />
    </div>

    <h3
      :id="headingId"
      class="card__name"
      :style="{
        viewTransitionName: `planet-name-${planet.id}`,
        viewTransitionClass: 'planet-name',
      }"
    >
      <RouterLink :to="{ name: 'planet', params: { id: planet.id } }" class="card__link">
        {{ planet.name }}
      </RouterLink>
    </h3>
    <p class="card__terrain">{{ formatList(planet.terrains) }}</p>

    <PlanetGauges class="card__gauges" :planet="planet" />

    <!-- The arrow sits beside the film list in normal flow, so no content can run under it. -->
    <footer class="card__footer">
      <div class="card__films">
        <h4 class="card__films-label">Appears in</h4>
        <ul v-if="filmsStatus === 'ready' && films.length" class="card__film-list">
          <li v-for="film in films" :key="film.id" class="chip">{{ film.title }}</li>
        </ul>
        <p v-else-if="filmsStatus === 'ready' || planet.filmIds.length === 0" class="card__muted">
          Not featured in any film
        </p>
        <p v-else-if="filmsStatus === 'failed'" class="card__muted">
          Film titles unavailable ({{ planet.filmIds.length }} films)
        </p>
        <ul v-else class="card__film-list" aria-label="Loading film titles">
          <li v-for="id in planet.filmIds" :key="id" class="chip chip--skeleton" />
        </ul>
      </div>

      <span class="card__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M8 16 16 8M9 8h7v7" /></svg>
      </span>
    </footer>
  </article>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  // Without this the card's min-content (the nowrap climate line) can outgrow narrow screens.
  min-width: 0;
  container-type: inline-size;
  padding: var(--space-5);
  @include glass;
  // A faint wash of the planet's colour behind the art, stronger on hover.
  background-image: radial-gradient(
    16rem 12rem at 50% 28%,
    color-mix(in oklab, var(--tint) 9%, transparent),
    transparent 70%
  );
  transition:
    border-color var(--duration-base) var(--ease-out),
    background-color var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);

  // Signature hairline along the top edge.
  &::before {
    content: '';
    position: absolute;
    inset: 0 12% auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--tint), transparent);
    opacity: 0.45;
    transition: opacity var(--duration-base);
  }

  &:hover,
  &:focus-within {
    border-color: color-mix(in oklab, var(--tint) 45%, transparent);
    background-color: var(--surface-glass-hover);

    &::before {
      opacity: 1;
    }
  }

  @include motion {
    &:hover {
      transform: translateY(-3px);
    }
  }

  &:hover :deep(.art__spin) {
    animation-play-state: running;
  }
}

.card__top {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  @include eyebrow;
}

.card__index {
  flex: none;
  color: var(--tint);
}

// Soft light that follows the pointer (see usePointerLight); invisible until hovered.
// Ambient life: a glint of the planet's colour slowly orbits the card's border.
// Animating a registered custom property lets the conic gradient rotate smoothly.
@property --ring-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.card__ring {
  position: absolute;
  inset: -1px;
  padding: 1.5px;
  border-radius: inherit;
  background: conic-gradient(
    from var(--ring-angle),
    transparent 0 68%,
    color-mix(in oklab, var(--tint) 45%, transparent) 82%,
    var(--tint) 92%,
    transparent 100%
  );
  // Show the gradient only in the 1px border band.
  mask:
    linear-gradient(#000 0 0) content-box exclude,
    linear-gradient(#000 0 0);
  opacity: 0.75;
  pointer-events: none;
  transition: opacity var(--duration-base);

  .card:hover & {
    opacity: 1;
  }

  @include motion {
    animation: ring-orbit var(--ring-period) linear var(--ring-delay) infinite;
  }
}

@keyframes ring-orbit {
  to {
    --ring-angle: 360deg;
  }
}

.card__glare {
  position: absolute;
  inset: 0;
  // Behind the text; the card's backdrop-filter makes it a stacking context, so it stays inside.
  z-index: -1;
  border-radius: inherit;
  background: radial-gradient(
    18rem circle at var(--mx, 50%) var(--my, 30%),
    color-mix(in oklab, var(--tint) 13%, transparent),
    transparent 65%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-base);

  .card:hover & {
    opacity: 1;
  }
}

.card__visual {
  position: relative;
  width: min(10rem, 62%);
  margin: var(--space-4) auto var(--space-3);

  // Scan line sweeping across the planet on hover, as in the detail design reference.
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(
      to bottom,
      transparent 0 46%,
      color-mix(in oklab, var(--tint) 55%, transparent) 50%,
      transparent 54%
    );
    background-size: 100% 300%;
    background-position: 0 100%;
    opacity: 0;
    pointer-events: none;
  }
}

.card__climate {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@include motion {
  // The planet leans slightly towards the pointer.
  .card__art {
    transform: translate(calc(var(--px, 0) * 6px), calc(var(--py, 0) * 6px));
    transition: transform 400ms var(--ease-out);
  }

  .card:hover .card__visual::after {
    animation: scan 1.4s var(--ease-out) both;
  }
}

.card__gauges {
  margin-top: var(--space-3);
}

.card__name {
  // Scales down with the card so ten-letter names ("Muunilinst") fit narrow columns.
  font-size: min(var(--text-lg), 8.5cqi);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  overflow-wrap: break-word;
}

// Stretched link: the whole card is clickable, but only the name is announced as a link.
.card__link {
  text-decoration: none;
  outline: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &:focus-visible::after {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: var(--radius-lg);
  }
}

.card__terrain {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.card__footer {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.card__films {
  display: grid;
  flex: 1;
  gap: var(--space-2);
  min-width: 0;
}

.card__films-label {
  @include eyebrow;
  font-weight: 400;
}

.card__film-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.chip {
  padding: 0.2rem 0.65rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 0.03);
  font-size: var(--text-xs);
  color: var(--color-text);
}

.chip--skeleton {
  width: 5.5rem;
  height: 1.6rem;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.06), transparent) 0 0 / 200%
    100%;

  @include motion {
    animation: shimmer 1.4s linear infinite;
  }
}

.card__muted {
  color: var(--color-text-faint);
  font-size: var(--text-xs);
}

.card__arrow {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition:
    background var(--duration-base),
    color var(--duration-base),
    border-color var(--duration-base);

  svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .card:hover &,
  .card:focus-within & {
    background: var(--tint);
    border-color: var(--tint);
    color: var(--color-bg);
  }
}

@keyframes scan {
  0% {
    opacity: 1;
    background-position: 0 100%;
  }

  100% {
    opacity: 0;
    background-position: 0 0%;
  }
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
