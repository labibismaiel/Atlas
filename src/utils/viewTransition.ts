import { nextTick } from 'vue'
import type { Router } from 'vue-router'
import { prefersReducedMotion } from './motion'

/** Kinds of transition, exposed as `<html data-transition="…">` so CSS can style each one. */
export type TransitionKind = 'route' | 'results'

/**
 * The browser only runs a transition's update once it renders the next frame. If it doesn't
 * (a background tab or pane), the update must still happen: data never waits on animation.
 */
export const UPDATE_DEADLINE_MS = 1000

/** View Transitions are a progressive enhancement: unsupported or reduced motion → no animation. */
export function canTransition(): boolean {
  return (
    typeof document.startViewTransition === 'function' &&
    document.visibilityState !== 'hidden' &&
    !prefersReducedMotion()
  )
}

/**
 * Runs a DOM update inside a View Transition when possible, otherwise immediately.
 * With a transition, `update` runs a frame later (after the old state is captured), so callers
 * that guard against stale data must re-check inside it. `update` runs exactly once.
 */
export function withViewTransition(kind: TransitionKind, update: () => void | Promise<void>): void {
  if (!canTransition()) {
    void update()
    return
  }

  let started = false
  const runUpdate = async () => {
    if (started) return
    started = true
    await update()
    await nextTick()
  }

  const root = document.documentElement
  root.dataset.transition = kind
  const transition = document.startViewTransition(runUpdate)

  const deadline = setTimeout(() => {
    if (started) return
    transition.skipTransition()
    void runUpdate()
  }, UPDATE_DEADLINE_MS)

  // An aborted or skipped animation is not an error: the update itself still applies.
  transition.ready.catch(() => {})
  void transition.finished
    .catch(() => {})
    .finally(() => {
      clearTimeout(deadline)
      if (root.dataset.transition === kind) delete root.dataset.transition
    })
}

/**
 * Animates page changes (list ↔ detail) with a View Transition. Query-only changes such as
 * search and paging are left alone; the list animates those itself when results arrive.
 */
export function installRouteTransitions(router: Router): void {
  let finishUpdate: (() => void) | undefined

  router.beforeResolve((to, from) => {
    if (to.path === from.path || from.matched.length === 0 || !canTransition()) return
    // Hold the navigation until the browser has captured the old page, then let it render;
    // the transition's update completes in afterEach, once the new view is in the DOM.
    return new Promise<void>((resolveGuard) => {
      withViewTransition(
        'route',
        () =>
          new Promise<void>((done) => {
            finishUpdate = done
            resolveGuard()
          }),
      )
    })
  })

  router.afterEach(async () => {
    if (!finishUpdate) return
    const done = finishUpdate
    finishUpdate = undefined
    await nextTick() // new view rendered (and scroll restored) before the new state is captured
    done()
  })
}
