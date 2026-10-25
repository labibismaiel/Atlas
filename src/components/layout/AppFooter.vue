<template>
  <footer class="footer">
    <p>
      Data from <a href="https://swapi.dev" target="_blank" rel="noopener noreferrer">SWAPI</a>.
      Planet artwork is generated from each planet's climate and terrain.
    </p>
    <p>Fan project, not affiliated with Lucasfilm.</p>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2) var(--space-5);
  width: 100%;
  max-width: var(--container);
  margin: var(--space-8) auto 0;
  padding: var(--space-5) var(--gutter) var(--space-6);
  border-top: 1px solid var(--border-subtle);
  color: var(--color-text-faint);
  font-size: var(--text-xs);

  a {
    color: var(--color-text-muted);
    border-radius: 2px;
    @include focus-ring(2px);

    &:hover {
      color: var(--color-accent);
    }
  }
}
</style>
