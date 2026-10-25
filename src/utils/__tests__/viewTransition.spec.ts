import { afterEach, describe, expect, it, vi } from 'vitest'
import { UPDATE_DEADLINE_MS, withViewTransition } from '../viewTransition'

interface FakeTransition {
  ready: Promise<void>
  finished: Promise<void>
  skipTransition: () => void
}
type Start = (update: () => Promise<void>) => FakeTransition

function stubStart(): ReturnType<typeof vi.fn<Start>> {
  const start = vi.fn<Start>((update) => {
    const finished = update()
    return { ready: finished, finished, skipTransition: () => {} }
  })
  Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true })
  return start
}

afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition')
  delete document.documentElement.dataset.transition
})

describe('withViewTransition', () => {
  it('applies the update immediately when View Transitions are unsupported', () => {
    const update = vi.fn<() => void>()
    withViewTransition('results', update)
    expect(update).toHaveBeenCalledOnce()
  })

  it('runs the update inside a transition and tags the document with its kind', async () => {
    const start = stubStart()
    const update = vi.fn<() => void>()

    withViewTransition('results', update)

    expect(start).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.transition).toBe('results')
    await vi.waitFor(() => expect(update).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(document.documentElement.dataset.transition).toBeUndefined())
  })

  it('skips the animation when the user prefers reduced motion', () => {
    const start = stubStart()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }))
    const update = vi.fn<() => void>()

    withViewTransition('route', update)

    expect(start).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledOnce()
  })

  it('still applies the update when the browser never runs the transition callback', async () => {
    vi.useFakeTimers()
    const skipTransition = vi.fn<() => void>()
    const pending = new Promise<void>(() => {})
    const start = vi.fn<Start>(() => ({ ready: pending, finished: pending, skipTransition }))
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true })
    const update = vi.fn<() => void>()

    withViewTransition('results', update)
    expect(update).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(UPDATE_DEADLINE_MS)
    expect(skipTransition).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})
