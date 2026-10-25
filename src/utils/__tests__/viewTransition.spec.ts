import { afterEach, describe, expect, it, vi } from 'vitest'
import { withViewTransition } from '../viewTransition'

type Start = (update: () => Promise<void>) => { finished: Promise<void> }

function stubStart(): ReturnType<typeof vi.fn<Start>> {
  const start = vi.fn<Start>((update) => ({ finished: update() }))
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
})
