import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Index from './Index.vue'

describe('Index.vue', () => {
  it('increments count when the button is clicked', async () => {
    const wrapper = mount(Index, {
      shallow: true,
      props: {
        hint: 'test hint',
        appName: 'Test app',
      },
      global: {
        stubs: {
          Link: {
            props: ['href'],
            template: '<a :href="href"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('test hint')
    expect(wrapper.text()).toContain('Test app')
    expect(wrapper.text()).toContain('Count is: 0')

    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toContain('Count is: 1')
  })
})
