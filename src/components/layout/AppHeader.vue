<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import { useOnline } from '@/composables/useOnline'

const time = useClock()
const online = useOnline()
</script>

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
        <span class="brand__text">
          <span class="brand__name">Atlas</span>
          <span class="brand__sub">Holonet archive // v1</span>
        </span>
      </RouterLink>

      <!-- Console flavour; decorative, so hidden from assistive technology. -->
      <div class="readout" aria-hidden="true">
        <span class="readout__seg">Sector <em>Outer Rim</em></span>
        <span class="readout__seg">Node <em>7G-114</em></span>
        <span class="readout__seg"
          >GST <em class="readout__clock">{{ time }}</em></span
        >
      </div>

      <!-- Real state: whether the browser can reach the network. -->
      <p class="link" :class="{ 'is-offline': !online }" role="status">
        <span class="link__signal" aria-hidden="true"><i /><i /><i /><i /></span>
        {{ online ? 'Link stable' : 'Link lost' }}
      </p>
    </div>
    <div class="header__edge" aria-hidden="true" />
  </header>
</template>

<style scoped lang="scss">
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(5 7 11 / 0.7);
  backdrop-filter: blur(12px);
}

.header__inner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-5);
  max-width: var(--container);
  margin-inline: auto;
  padding: var(--space-3) var(--gutter);
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
  flex: none;
  width: 1.75rem;
  height: 1.75rem;
}

.brand__text {
  display: grid;
  gap: 3px;
}

.brand__name {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.5em;
  text-transform: uppercase;
}

.brand__sub {
  display: none;
  font-family: var(--font-display);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-faint);

  @include up(sm) {
    display: block;
  }
}

.readout {
  display: none;
  justify-content: center;
  gap: 2px;

  @include up(lg) {
    display: flex;
  }
}

// Slanted console panels.
.readout__seg {
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--border-subtle);
  background: rgb(255 255 255 / 0.02);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-muted);

  em {
    font-style: normal;
    color: var(--color-text);
  }
}

.readout__clock {
  font-variant-numeric: tabular-nums;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  justify-self: end;
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-status);

  &.is-offline {
    color: var(--color-danger);
  }
}

.link__signal {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;

  i {
    width: 3px;
    background: currentColor;

    @for $n from 1 through 4 {
      &:nth-child(#{$n}) {
        height: 1px + $n * 3px;
        animation-delay: ($n - 1) * 0.2s;
      }
    }

    @include motion {
      animation: signal 1.6s ease-in-out infinite;
    }

    .is-offline & {
      animation: none;
      opacity: 0.35;
    }
  }
}

// Bottom edge: tick marks and a travelling light, the same motif as the card glint.
.header__edge {
  position: relative;
  height: 1px;
  overflow: hidden;
  background: var(--border-subtle);

  &::after {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 11rem;
    background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
    opacity: 0.8;

    @include motion {
      animation: travel 7s linear infinite;
    }
  }
}

@keyframes signal {
  50% {
    opacity: 0.3;
  }
}

@keyframes travel {
  from {
    transform: translateX(-11rem);
  }

  to {
    transform: translateX(100vw);
  }
}
</style>
