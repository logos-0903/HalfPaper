import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/write/:id?',
    name: 'diary-editor',
    component: () => import('../views/diary/Editor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/manage/list',
    name: 'manage-list',
    component: () => import('../views/manage/List.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/info',
    name: 'user-info',
    component: () => import('../views/user/Info.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/user/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/user/Register.vue'),
    meta: { guestOnly: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)

  if (!authStore.initialized) {
    try {
      await authStore.initialize()
    } catch {
      authStore.initialized = true
    }
  }

  if (to.meta.guestOnly && authStore.isLoggedIn) {
    return { path: '/' }
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }

  return true
})

export default router
