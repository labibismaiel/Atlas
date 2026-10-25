import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { LOCK_STEP_MS, SHUFFLE_MIN_MS, useDecodedText, useScrambledNumber } from '../useScramble'

function scrambled(initial: number | null) {
  const value = ref<number | null>(initial)
  const scope = effectScope()
  const result = scope.run(() => useScrambledNumber(value))!
  return { value, scope, ...result }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useScrambledNumber', () => {
  it('keeps shuffling digits while the value is unknown', async () => {
    const { display, settled } = scrambled(null)
    await vi.advanceTimersByTimeAsync(SHUFFLE_MIN_MS * 3)
    expect(display.value).toMatch(/^\d\d$/)
    expect(settled.value).toBe(false)
  })

  it('locks onto the value from the left once it arrives and the minimum shuffle has run', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // shuffled digits render as 9
    const { value, display, settled } = scrambled(null)
    value.value = 60
    await nextTick()

    await vi.advanceTimersByTimeAsync(SHUFFLE_MIN_MS - 100)
    expect(display.value).toBe('99')

    await vi.advanceTimersByTimeAsync(150)
    expect(display.value).toBe('69') // first digit locked, second still shuffling

    await vi.advanceTimersByTimeAsync(LOCK_STEP_MS)
    expect(display.value).toBe('60')
    expect(settled.value).toBe(true)
  })

  it('shows the value at once with reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }))
    const { display, settled } = scrambled(82)
    expect(display.value).toBe('82')
    expect(settled.value).toBe(true)
  })

  it('can halt with a fallback text, e.g. when loading failed', async () => {
    const { display, halt } = scrambled(null)
    halt('n/a')
    await vi.advanceTimersByTimeAsync(SHUFFLE_MIN_MS)
    expect(display.value).toBe('n/a')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stops its timer when the owning scope is disposed', () => {
    const { scope } = scrambled(null)
    expect(vi.getTimerCount()).toBe(1)
    scope.stop()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('useDecodedText', () => {
  it('decodes into the final text and then stops', async () => {
    const scope = effectScope()
    const { display } = scope.run(() => useDecodedText('Holonet archive'))!
    expect(display.value).not.toBe('Holonet archive')
    await vi.advanceTimersByTimeAsync(5000)
    expect(display.value).toBe('Holonet archive')
    expect(vi.getTimerCount()).toBe(0)
  })
})
