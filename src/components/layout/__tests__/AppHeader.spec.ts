import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppHeader from '../AppHeader.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { render: () => null } }],
})

describe('AppHeader', () => {
  it('reflects the real network state in the link indicator', async () => {
    const wrapper = mount(AppHeader, { global: { plugins: [router] } })
    expect(wrapper.get('[role="status"]').text()).toBe('Link stable')

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    window.dispatchEvent(new Event('offline'))
    await nextTick()

    expect(wrapper.get('[role="status"]').text()).toBe('Link lost')
    expect(wrapper.get('.link').classes()).toContain('is-offline')
    wrapper.unmount()
  })

  it('keeps the decorative console readout away from assistive technology', () => {
    const wrapper = mount(AppHeader, { global: { plugins: [router] } })
    expect(wrapper.get('.readout').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })
})
