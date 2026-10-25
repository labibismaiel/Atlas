<template>
  <section class="not-found">
    <p class="not-found__code">404</p>
    <h1>This sector is uncharted</h1>
    <p>The page you were looking for doesn't exist.</p>
    <RouterLink class="not-found__link" to="/">Back to all planets</RouterLink>
  </section>
</template>

<style scoped lang="scss">
.not-found {
  display: grid;
  justify-items: start;
  gap: var(--space-4);
  padding-block: var(--space-8);
}

.not-found__code {
  @include eyebrow;
  color: var(--color-accent);
}

.not-found__link {
  margin-top: var(--space-3);
  border-radius: var(--radius-sm);
  @include focus-ring;
}
</style>
