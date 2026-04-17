/**
 * 应用路由配置
 * - requiresAuth: 需登录后访问
 * - requiresAdmin: 需管理员权限
 * - guestOnly: 仅未登录用户可访问
 */
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
    path: '/diary/detail/:id',
    name: 'Detail',
    component: () => import('../views/diary/Detail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/firefly',
    name: 'firefly',
    component: () => import('../views/Firefly.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/Favorites.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/manage/list',
    name: 'manage-list',
    component: () => import('../views/manage/DiaryManager.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/manage/messages',
    name: 'manage-messages',
    component: () => import('../views/manage/MessageInbox.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/manage/admin',
    name: 'manage-admin',
    component: () => import('../views/manage/ModerationCenter.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/user/info',
    name: 'user-info',
    component: () => import('../views/user/Info.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/edit',
    name: 'user-editor',
    component: () => import('../views/user/ProfileEditor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings/:tab?',
    name: 'settings',
    component: () => import('../views/user/settings/ProfileSettings.vue'),
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
  },
  {
    path: '/about/:tab?',
    name: 'about',
    component: () => import('../views/About.vue')
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

  if (to.meta.requiresAdmin) {
    const isAdmin = Boolean(authStore.profile?.is_admin) || authStore.profile?.role === 'admin'
    if (!isAdmin) {
      return { path: '/' }
    }
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
