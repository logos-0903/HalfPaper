import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { zhHans } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'
import './assets/layout.css'

const initialTheme = typeof window !== 'undefined'
  ? localStorage.getItem('halfpaper.theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'halfpaperDark' : 'halfpaperLight')
  : 'halfpaperLight'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  locale: {
    locale: 'zh-hans',
    messages: { zhHans }
  },
  theme: {
    defaultTheme: initialTheme,
    themes: {
      halfpaperLight: {
        dark: false,
        colors: {
          background: '#f6f2ea',
          surface: '#fffdf9',
          primary: '#8b5e3c',
          secondary: '#caa472',
          accent: '#507687',
          error: '#b64d4d',
          info: '#507687',
          success: '#688f4e',
          warning: '#b98a36'
        }
      },
      halfpaperDark: {
        dark: true,
        colors: {
          background: '#15181c',
          surface: '#1f2328',
          primary: '#d8b48a',
          secondary: '#7da6b8',
          accent: '#90c0d3',
          error: '#f19c9c',
          info: '#9fc7d8',
          success: '#98c07b',
          warning: '#f0c06b'
        }
      }
    }
  }
})

createApp(App)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .mount('#app')
