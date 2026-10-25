<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink to="/" class="brand" aria-label="Star Wars Atlas, home">
        <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" stroke-width="1.5" />
          <ellipse
            cx="16"
            cy="16"
            rx="15"
            ry="5"
            fill="none"
            stroke="var(--color-accent)"
            stroke-width="1.5"
            transform="rotate(-20 16 16)"
          />
        </svg>
        <span class="brand__name">Atlas</span>
      </RouterLink>
      <p class="header__tag">
        <span class="header__dot" aria-hidden="true" />
        A Star Wars planet catalogue
      </p>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  border-bottom: 1px solid var(--border-subtle);
  background: rgb(5 7 11 / 0.6);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  max-width: var(--container);
  margin-inline: auto;
  padding: var(--space-4) var(--gutter);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  border-radius: var(--radius-sm);
  @include focus-ring;
}

.brand__mark {
  width: 1.75rem;
  height: 1.75rem;
}

.brand__name {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.5em;
  text-transform: uppercase;
}

.header__tag {
  display: none;
  align-items: center;
  gap: var(--space-2);
  @include eyebrow;

  @include up(sm) {
    display: inline-flex;
  }
}

.header__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-status);
  box-shadow: 0 0 8px var(--color-status);
}
</style>
