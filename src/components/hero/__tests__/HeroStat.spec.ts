import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroStat from '../HeroStat.vue'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('HeroStat', () => {
  it('announces the real value, never the shuffling digits', async () => {
    const wrapper = mount(HeroStat, { props: { label: 'Planets charted', value: null } })
    expect(wrapper.get('.visually-hidden').text()).toBe('Planets charted: loading')

    await wrapper.setProps({ value: 60 })
    expect(wrapper.get('.visually-hidden').text()).toBe('60 planets charted')

    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.get('.stat__value [aria-hidden="true"]').text()).toBe('60')
    expect(wrapper.classes()).toContain('is-settled')
  })

  it('says a figure is unavailable when it failed to load', async () => {
    const wrapper = mount(HeroStat, {
      props: { label: 'Residents logged', value: null, failed: true },
    })
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.get('.stat__value [aria-hidden="true"]').text()).toBe('n/a')
    expect(wrapper.get('.visually-hidden').text()).toBe('Residents logged: unavailable')
    expect(wrapper.classes()).toContain('is-failed')
  })
})
