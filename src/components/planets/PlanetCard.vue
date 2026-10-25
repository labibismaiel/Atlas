<script setup lang="ts">
import { computed } from 'vue'
import type { Film, Planet } from '@/models'
import { formatList } from '@/utils/format'
import PlanetArt from '@/components/planet/PlanetArt.vue'

const props = defineProps<{
  planet: Planet
  films: Film[]
  /** Catalogue status, so a missing title list is never mistaken for "no films". */
  filmsStatus: 'loading' | 'ready' | 'failed'
}>()

const headingId = computed(() => `planet-${props.planet.id}-name`)
</script>

<template>
  <article class="card" :aria-labelledby="headingId">
    <header class="card__top">
      <span class="card__index">No. {{ planet.id.padStart(2, '0') }}</span>
      <span class="card__climate">{{ formatList(planet.climates) }}</span>
    </header>

    <PlanetArt class="card__art" :planet="planet" size="sm" />

    <h3 :id="headingId" class="card__name">
      <RouterLink :to="{ name: 'planet', params: { id: planet.id } }" class="card__link">
        {{ planet.name }}
      </RouterLink>
    </h3>
    <p class="card__terrain">{{ formatList(planet.terrains) }}</p>

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
  </article>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  @include glass;
  transition:
    border-color var(--duration-base) var(--ease-out),
    background var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);

  &:hover,
  &:focus-within {
    border-color: var(--border-strong);
    background: var(--surface-glass-hover);
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
}

.card__climate {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__art {
  width: min(10rem, 62%);
  margin: var(--space-4) auto var(--space-3);
}

.card__name {
  font-size: var(--text-lg);
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

.card__films {
  display: grid;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
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
  padding-right: 2.5rem; // room for the arrow
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
  position: absolute;
  right: var(--space-5);
  bottom: var(--space-5);
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
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-bg);
  }
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
