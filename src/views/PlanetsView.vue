<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from 'vue'
import { usePlanetSearch } from '@/composables/usePlanetSearch'
import { useFilms } from '@/composables/useFilms'
import { pluralize } from '@/utils/format'
import { withViewTransition } from '@/utils/viewTransition'
import { ApiError } from '@/api/http'
import SearchField from '@/components/planets/SearchField.vue'
import PlanetCard from '@/components/planets/PlanetCard.vue'
import PaginationNav from '@/components/planets/PaginationNav.vue'
import StatusPanel from '@/components/ui/StatusPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import HeroSection from '@/components/hero/HeroSection.vue'

// Container view: owns data and state, hands plain props to presentational components.
// New results animate in (paging, search); see the 'results' rules in styles/_transitions.scss.
const search = usePlanetSearch({ applyResult: (write) => withViewTransition('results', write) })
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
    <HeroSection />

    <section id="results" class="results" aria-labelledby="results-title">
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
          <li
            v-for="(planet, index) in result.items"
            :key="planet.id"
            :style="{
              viewTransitionName: `card-${planet.id}`,
              viewTransitionClass: `card stagger-${index}`,
            }"
          >
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
// minmax(0, 1fr): grid items default to min-width: auto, which lets the search input's
// intrinsic width push the page wider than a phone screen.
.results {
  scroll-margin-top: 5rem;
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
