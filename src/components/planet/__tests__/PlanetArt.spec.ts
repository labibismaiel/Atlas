import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import PlanetArt from '../PlanetArt.vue'

const hoth = { name: 'Hoth', climates: ['frozen'], terrains: ['tundra'] }
const mustafar = { name: 'Mustafar', climates: ['hot'], terrains: ['volcanoes'] }

describe('PlanetArt', () => {
  it('is decorative and reflects the biome', () => {
    const wrapper = mount(PlanetArt, { props: { planet: hoth } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.classes()).toContain('art--frozen')
    expect(wrapper.find('.art__caps').exists()).toBe(true)
  })

  it('adds an emissive layer only for biomes that glow', () => {
    expect(
      mount(PlanetArt, { props: { planet: mustafar } })
        .find('.art__glow')
        .exists(),
    ).toBe(true)
    expect(
      mount(PlanetArt, { props: { planet: hoth } })
        .find('.art__glow')
        .exists(),
    ).toBe(false)
  })

  it('gives every instance its own SVG ids so definitions never collide', () => {
    const wrapper = mount(
      defineComponent({
        render: () => [h(PlanetArt, { planet: hoth }), h(PlanetArt, { planet: mustafar })],
      }),
    )
    const ids = wrapper.findAll('[id]').map((node) => node.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('adds scan lines and more noise detail at the large size', () => {
    const small = mount(PlanetArt, { props: { planet: hoth, size: 'sm' } })
    const large = mount(PlanetArt, { props: { planet: hoth, size: 'lg' } })
    expect(small.find('pattern').exists()).toBe(false)
    expect(large.find('pattern').exists()).toBe(true)
    expect(large.find('feTurbulence').attributes('numOctaves')).toBe('5')
  })
})
