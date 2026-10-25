<script setup lang="ts">
import { computed, toRef, watch } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { usePlanet } from '@/composables/usePlanet'
import { useFilms } from '@/composables/useFilms'
import { describePlanet } from '@/utils/describePlanet'
import { episodeLabel, formatList, pluralize, withUnit } from '@/utils/format'
import PlanetArt from '@/components/planet/PlanetArt.vue'
import FactList, { type Fact } from '@/components/planet/FactList.vue'
import StatusPanel from '@/components/ui/StatusPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ id: string }>()

const { planet, state, error, residents, missingResidents, retry } = usePlanet(toRef(props, 'id'))
const filmsCatalogue = useFilms()
const router = useRouter()

// Return to the exact list the user came from (search + page), or the first page otherwise.
const backTo = computed<RouteLocationRaw>(() => {
  const back = router.options.history.state.back
  if (typeof back === 'string' && router.resolve(back).name === 'planets') return back
  return { name: 'planets' }
})

const films = computed(() => (planet.value ? filmsCatalogue.filmsFor(planet.value.filmIds) : []))

const fact = (label: string, value: string, unknown = false): Fact => ({ label, value, unknown })

const keyFacts = computed<Fact[]>(() => {
  const p = planet.value
  if (!p) return []
  return [
    fact('climate', formatList(p.climates), !p.climates.length),
    fact('diameter', withUnit(p.diameter, 'km'), p.diameter === null),
    fact('gravity', p.gravity ?? 'Unknown', p.gravity === null),
    fact(
      'population',
      p.population === null ? 'Unknown' : pluralize(p.population, 'person', 'people'),
      p.population === null,
    ),
  ]
})

const physicalFacts = computed<Fact[]>(() => {
  const p = planet.value
  if (!p) return []
  return [
    fact('Rotation period', withUnit(p.rotationPeriod, 'hours'), p.rotationPeriod === null),
    fact('Orbital period', withUnit(p.orbitalPeriod, 'days'), p.orbitalPeriod === null),
    fact(
      'Surface water',
      p.surfaceWater === null ? 'Unknown' : `${p.surfaceWater}%`,
      p.surfaceWater === null,
    ),
    fact('Diameter', withUnit(p.diameter, 'km'), p.diameter === null),
    fact('Gravity', p.gravity ?? 'Unknown', p.gravity === null),
  ]
})

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })
const formatDate = (iso: string) => dateFormat.format(new Date(iso))
const year = (iso: string) => iso.slice(0, 4)

watch(planet, (value) => {
  if (value) document.title = `${value.name} · Star Wars Atlas`
})
</script>

<template>
  <article class="detail" :aria-busy="state === 'loading'">
    <RouterLink :to="backTo" class="detail__back">
      <span aria-hidden="true">←</span> All planets
    </RouterLink>

    <div v-if="state === 'loading'" class="detail__loading" role="status">
      <span class="detail__spinner" aria-hidden="true" />
      Retrieving archive record…
    </div>

    <StatusPanel
      v-else-if="state === 'not-found'"
      title="This planet is not in the archive"
      :level="1"
    >
      <p>There is no planet with id {{ id }}. It may have been lost to the Jedi archives.</p>
      <template #actions>
        <RouterLink :to="{ name: 'planets' }" class="detail__link">Browse all planets</RouterLink>
      </template>
    </StatusPanel>

    <StatusPanel
      v-else-if="state === 'error'"
      tone="danger"
      title="The archive is not responding"
      :level="1"
    >
      <p>{{ error?.message ?? 'Something went wrong.' }}</p>
      <template #actions>
        <AppButton variant="primary" @click="retry">Retry</AppButton>
      </template>
    </StatusPanel>

    <template v-else-if="planet">
      <section class="hero" aria-labelledby="planet-name">
        <div class="hero__text">
          <p class="hero__eyebrow">Planet No. {{ planet.id.padStart(2, '0') }}</p>
          <h1 id="planet-name" class="hero__name">{{ planet.name }}</h1>
          <FactList :facts="keyFacts" class="hero__facts" />
          <div class="hero__rule" aria-hidden="true"><span /><span /><span /></div>
          <p class="hero__summary">{{ describePlanet(planet) }}</p>

          <div class="hero__terrain">
            <h2 class="label">Landscape type</h2>
            <ul v-if="planet.terrains.length" class="tags">
              <li v-for="terrain in planet.terrains" :key="terrain" class="tag">{{ terrain }}</li>
            </ul>
            <p v-else class="muted">Unknown</p>
          </div>
        </div>

        <div class="hero__visual">
          <div class="orbit" aria-hidden="true">
            <span class="orbit__ring orbit__ring--outer"><i /></span>
            <span class="orbit__ring orbit__ring--inner"><i /></span>
          </div>
          <PlanetArt :planet="planet" size="lg" class="hero__art" />
        </div>
      </section>

      <div class="panels">
        <section class="panel" aria-labelledby="physical-title">
          <h2 id="physical-title" class="label">Physical characteristics</h2>
          <FactList :facts="physicalFacts" />
        </section>

        <section class="panel" aria-labelledby="films-title">
          <h2 id="films-title" class="label">Filmography</h2>
          <p v-if="planet.filmIds.length === 0" class="muted">Not featured in any film.</p>
          <p v-else-if="filmsCatalogue.failed.value" class="muted">
            Film titles unavailable.
            <button type="button" class="inline-button" @click="filmsCatalogue.retry">Retry</button>
          </p>
          <ol v-else-if="filmsCatalogue.films.value" class="films">
            <li v-for="film in films" :key="film.id" class="films__item">
              <span class="films__episode">{{ episodeLabel(film.episode) }}</span>
              <span class="films__title">{{ film.title }}</span>
              <span class="films__year">{{ year(film.releaseDate) }}</span>
            </li>
          </ol>
          <p v-else class="muted">Loading films…</p>
        </section>

        <section class="panel" aria-labelledby="residents-title">
          <h2 id="residents-title" class="label">
            Notable residents
            <span v-if="planet.residentIds.length" class="label__count">{{
              planet.residentIds.length
            }}</span>
          </h2>
          <p v-if="planet.residentIds.length === 0" class="muted">No known residents on record.</p>
          <p v-else-if="residents === null" class="muted">Loading residents…</p>
          <template v-else>
            <ul class="tags">
              <li v-for="person in residents" :key="person.id" class="tag">{{ person.name }}</li>
            </ul>
            <p v-if="missingResidents" class="muted">
              {{ pluralize(missingResidents, 'resident') }} could not be loaded.
            </p>
          </template>
        </section>
      </div>

      <p class="detail__meta">
        Archive record created {{ formatDate(planet.createdAt) }}, last updated
        {{ formatDate(planet.editedAt) }}.
      </p>
    </template>
  </article>
</template>

<style scoped lang="scss">
.detail {
  display: grid;
  gap: var(--space-6);
  padding-top: var(--space-5);
}

.detail__back,
.detail__link {
  justify-self: start;
  display: inline-flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-decoration: none;
  transition:
    color var(--duration-fast),
    border-color var(--duration-fast);
  @include focus-ring;

  &:hover {
    color: var(--color-text);
    border-color: var(--border-strong);
  }
}

.detail__loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 50vh;
  justify-content: center;
  color: var(--color-text-muted);
}

.detail__spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-strong);
  border-top-color: var(--color-accent);
  border-radius: 50%;

  @include motion {
    animation: spin 0.8s linear infinite;
  }
}

.hero {
  display: grid;
  gap: var(--space-7);
  align-items: center;

  @include up(lg) {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    min-height: 34rem;
  }
}

.hero__text {
  display: grid;
  gap: var(--space-5);
  // The name scales with its column, not the viewport, so long names never split mid-word.
  container-type: inline-size;
}

.hero__eyebrow {
  @include eyebrow;
  color: var(--color-accent);
}

.hero__name {
  // Michroma is wide (~0.95em per glyph); 9cqi fits ten-letter names such as "Muunilinst".
  font-size: clamp(2rem, 9cqi, 5.5rem);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  overflow-wrap: break-word;
  text-shadow:
    0 0 24px rgb(190 215 255 / 0.35),
    0 0 2px rgb(255 255 255 / 0.6);
}

.hero__facts {
  :deep(.facts__item) {
    border-top: 0;
    padding-top: 0;
  }
}

.hero__rule {
  display: flex;
  gap: var(--space-3);
  max-width: 32rem;

  span {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border-strong), transparent);
  }
}

.hero__summary {
  max-width: 34rem;
  color: var(--color-text);
  font-size: var(--text-md);
}

.hero__terrain {
  display: grid;
  gap: var(--space-3);
}

.hero__visual {
  position: relative;
  display: grid;
  place-items: center;
  width: min(80%, 30rem);
  margin-inline: auto;
  aspect-ratio: 1;
}

.hero__art {
  width: 64%;
}

.orbit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orbit__ring {
  position: absolute;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;

  // A satellite marker riding each ring.
  i {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-text);
    box-shadow: 0 0 12px rgb(255 255 255 / 0.8);
  }

  @include motion {
    animation: orbit 48s linear infinite;
  }
}

.orbit__ring--outer {
  inset: 0;

  i {
    top: 14%;
    right: 13%;
  }
}

.orbit__ring--inner {
  inset: 11%;
  border-color: rgb(255 255 255 / 0.12);
  animation-duration: 32s;
  animation-direction: reverse;

  i {
    bottom: 4%;
    left: 30%;
    width: 7px;
    height: 7px;
  }
}

.panels {
  display: grid;
  gap: var(--space-4);

  @include up(md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include up(xl) {
    grid-template-columns: 1.2fr 1fr 1fr;
  }
}

.panel {
  display: grid;
  align-content: start;
  gap: var(--space-4);
  padding: var(--space-5);
  @include glass;
}

.label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  @include eyebrow;
}

.label__count {
  padding: 0 var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--color-text);
}

.muted {
  color: var(--color-text-faint);
  font-size: var(--text-sm);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.tag {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 0.03);
  font-size: var(--text-sm);
  text-transform: capitalize;
}

.films {
  display: grid;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.films__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0 var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);

  &:last-child {
    border-bottom: 0;
  }
}

.films__episode {
  grid-column: 1 / -1;
  @include eyebrow;
}

.films__year {
  color: var(--color-text-faint);
  font-variant-numeric: tabular-nums;
}

.inline-button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-accent);
  text-decoration: underline;
  @include focus-ring(2px);
}

.detail__meta {
  color: var(--color-text-faint);
  font-size: var(--text-xs);
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}

@keyframes orbit {
  to {
    transform: rotate(1turn);
  }
}
</style>
