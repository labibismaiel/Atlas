<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from 'vue'
import { usePlanetSearch } from '@/composables/usePlanetSearch'
import { useFilms } from '@/composables/useFilms'
import { pluralize } from '@/utils/format'
import { ApiError } from '@/api/http'
import SearchField from '@/components/planets/SearchField.vue'
import PlanetCard from '@/components/planets/PlanetCard.vue'
import PaginationNav from '@/components/planets/PaginationNav.vue'
import StatusPanel from '@/components/ui/StatusPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'

// Container view: owns data and state, hands plain props to presentational components.
const search = usePlanetSearch()
const { state, result, query, error } = search
const filmsCatalogue = useFilms()

const searchField = useTemplateRef<InstanceType<typeof SearchField>>('searchField')
const resultsHeading = useTemplateRef<HTMLElement>('resultsHeading')

const filmsStatus = computed(() =>
  filmsCatalogue.films.value ? 'ready' : filmsCatalogue.failed.value ? 'failed' : 'loading',
)

/** A stale or hand-edited `?page=` beyond the last page: SWAPI answers 404. */
const isMissingPage = computed(
  () =>
    state.value === 'error' &&
    error.value instanceof ApiError &&
    error.value.kind === 'not-found' &&
    search.page.value > 1,
)

/** Results are on screen but no longer describe what is being asked for. */
const isStale = computed(() => state.value === 'updating')
const showGrid = computed(() => state.value === 'ready' || state.value === 'updating')

const summary = computed(() => {
  const data = result.value
  switch (state.value) {
    case 'loading':
      return 'Scanning the galaxy…'
    case 'updating':
      return search.input.value.trim() ? 'Searching…' : 'Updating…'
    case 'error':
      return 'Results unavailable'
    default:
      if (!data) return ''
      return data.query
        ? `${pluralize(data.total, 'planet')} matching “${data.query}”`
        : `${pluralize(data.total, 'planet')} charted`
  }
})

// Announced politely and only once a request settles, never on every keystroke.
const announcement = computed(() => {
  if (state.value === 'ready' || state.value === 'empty') return summary.value
  if (state.value === 'error') return 'Planets could not be loaded.'
  return ''
})

function clearSearch() {
  search.clear()
  searchField.value?.focus()
}

async function changePage(page: number) {
  search.goToPage(page)
  await nextTick()
  resultsHeading.value?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <div class="planets">
    <section class="hero" aria-labelledby="hero-title">
      <p class="hero__status">
        <span>Holonet archive</span>
        <span class="hero__live"><span class="hero__dot" aria-hidden="true" />Online</span>
      </p>
      <h1 id="hero-title" class="hero__title">
        Explore.<br />
        Discover.<br />
        <span class="hero__accent">Chart.</span>
      </h1>
      <p class="hero__lead">
        Every known planet in the Star Wars galaxy, and the films that brought it to the screen.
      </p>
      <div class="hero__orbit" aria-hidden="true"><span /><span /><span /></div>
    </section>

    <section class="results" aria-labelledby="results-title">
      <div class="toolbar">
        <SearchField
          ref="searchField"
          class="toolbar__search"
          :model-value="search.input.value"
          :busy="state === 'updating' || state === 'loading'"
          @update:model-value="search.setInput"
          @clear="clearSearch"
        />
        <div class="toolbar__summary">
          <h2 id="results-title" ref="resultsHeading" class="toolbar__title">Planets</h2>
          <p class="toolbar__count" :class="{ 'is-stale': isStale || state === 'loading' }">
            {{ summary }}
          </p>
        </div>
      </div>

      <p class="visually-hidden" role="status" aria-live="polite">{{ announcement }}</p>

      <ul v-if="state === 'loading'" class="grid" aria-hidden="true">
        <li v-for="n in 6" :key="n" class="skeleton" />
      </ul>

      <StatusPanel v-else-if="isMissingPage" :title="`Page ${search.page.value} doesn't exist`">
        <p>There are fewer results than that. The first page is a good place to start.</p>
        <template #actions>
          <AppButton variant="primary" @click="search.firstPage">Go to page 1</AppButton>
        </template>
      </StatusPanel>

      <StatusPanel
        v-else-if="state === 'error'"
        tone="danger"
        title="The archive is not responding"
      >
        <p>{{ error?.message ?? 'Something went wrong.' }} Your search is kept; try again.</p>
        <template #actions>
          <AppButton variant="primary" @click="search.retry">Retry</AppButton>
        </template>
      </StatusPanel>

      <StatusPanel v-else-if="state === 'empty'" :title="`No planets match “${query}”`">
        <p>Check the spelling, or try part of a name, like “tat” or “oo”.</p>
        <template #actions>
          <AppButton variant="primary" @click="clearSearch">Clear search</AppButton>
        </template>
      </StatusPanel>

      <div v-if="showGrid && result" class="grid-wrap" :class="{ 'is-stale': isStale }">
        <p v-if="isStale" class="grid-wrap__badge" aria-hidden="true">Updating results…</p>
        <ul class="grid" :aria-busy="isStale" :inert="isStale">
          <li v-for="planet in result.items" :key="planet.id">
            <PlanetCard
              :planet="planet"
              :films="filmsCatalogue.filmsFor(planet.filmIds)"
              :films-status="filmsStatus"
            />
          </li>
        </ul>
        <PaginationNav
          :page="result.page"
          :page-count="result.pageCount"
          :has-previous="result.hasPrevious"
          :has-next="result.hasNext"
          :disabled="isStale"
          @change="changePage"
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  // The decorative orbit bleeds past the right edge on tablets; clip it without
  // creating a scroll container.
  overflow-x: clip;
  display: grid;
  gap: var(--space-4);
  padding-block: var(--space-7) var(--space-7);

  @include up(md) {
    padding-block: var(--space-8);
  }
}

.hero__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  justify-self: start;
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
}

.hero__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.hero__title {
  position: relative;
  z-index: 1;
  font-size: var(--text-hero);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.hero__accent {
  color: var(--color-accent);
}

.hero__lead {
  position: relative;
  z-index: 1;
  max-width: 30rem;
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

// Decorative orbit rings, inspired by the design direction; hidden on small screens.
.hero__orbit {
  position: absolute;
  top: 50%;
  right: -4rem;
  display: none;
  width: 30rem;
  aspect-ratio: 1;
  translate: 0 -50%;
  pointer-events: none;

  @include up(md) {
    display: block;
  }

  @include up(lg) {
    right: 2rem;
  }

  span {
    position: absolute;
    inset: 0;
    border: 1px solid var(--border-subtle);
    border-radius: 50%;
    transform: rotateX(68deg) rotateZ(-18deg);
  }

  span:nth-child(2) {
    inset: 18%;
    border-color: rgb(255 255 255 / 0.12);
  }

  span:nth-child(3) {
    inset: 34%;
    border: 0;
    transform: none;
    background: radial-gradient(
      circle at 38% 34%,
      #e9d7a8 0%,
      #b48a4b 28%,
      #4b3518 58%,
      #120c05 74%
    );
    box-shadow:
      -18px -10px 60px rgb(255 216 77 / 0.15),
      inset -24px -18px 40px rgb(0 0 0 / 0.65);
  }
}

// minmax(0, 1fr): grid items default to min-width: auto, which lets the search input's
// intrinsic width push the page wider than a phone screen.
.results {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);

  @include up(md) {
    grid-template-columns: minmax(0, 28rem) 1fr;
    align-items: end;
  }
}

.toolbar__summary {
  display: grid;
  gap: var(--space-1);

  @include up(md) {
    justify-items: end;
    text-align: right;
  }
}

.toolbar__title {
  @include eyebrow;
  scroll-margin-top: 6rem;
}

.toolbar__count {
  min-height: 1.6em;
  font-size: var(--text-lg);
  transition: opacity var(--duration-fast);

  &.is-stale {
    color: var(--color-text-muted);
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.5rem), 1fr));
  gap: var(--space-4);
  padding: 0;
  list-style: none;

  > li {
    display: grid;
  }
}

.grid-wrap {
  position: relative;

  &.is-stale .grid {
    opacity: 0.35;
    filter: saturate(0.4);
    transition:
      opacity var(--duration-base),
      filter var(--duration-base);
  }
}

.grid-wrap__badge {
  position: absolute;
  top: var(--space-6);
  left: 50%;
  z-index: 2;
  translate: -50% 0;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--color-bg-elevated);
  @include eyebrow;
  color: var(--color-text);
}

.skeleton {
  min-height: 24rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.04), transparent 70%) 0 0 / 200%
      100%,
    var(--surface-glass);

  @include motion {
    animation: shimmer 1.6s linear infinite;
  }
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
