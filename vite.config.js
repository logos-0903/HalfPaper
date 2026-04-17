import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'

const API_TARGET = 'https://api.halfpaper.top'
const proxy = {
  '/api': {
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '',
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  server: {
    proxy
  },
  preview: {
    proxy
  },
  base: '/',
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
