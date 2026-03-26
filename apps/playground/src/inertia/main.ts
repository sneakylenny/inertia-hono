import './main.css'

import { createInertiaApp } from '@inertiajs/vue3'
import { createApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import Default from './layouts/Default.vue'

const pages = import.meta.glob<{ default: DefineComponent }>('./pages/**/*.vue')

createInertiaApp({
  layout: () => Default,
  resolve: async (name) => {
    const path = `./pages/${name}.vue`
    const load = pages[path]
    if (!load) {
      throw new Error(
        `Unknown Inertia page "${name}". Expected module at ${path}`,
      )
    }
    return (await load()).default
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
  progress: {
    color: '#4f46e5',
  },
})
