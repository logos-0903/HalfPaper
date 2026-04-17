/**
 * 认证状态管理
 * 负责登录/注册/登出流程，维护用户 profile 并缓存至 localStorage
 */
import { defineStore } from 'pinia'
import { getUserInfo, login, logout as logoutApi, register } from '@/services/api'
import { clearSessionCookies } from '@/utils/security'

const PROFILE_KEY = 'halfpaper.profile'

function readCachedProfile() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    profile: readCachedProfile(),
    initialized: false
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.profile?.email)
  },
  actions: {
    persistProfile() {
      if (this.profile) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile))
      } else {
        localStorage.removeItem(PROFILE_KEY)
      }
    },
    setProfile(profile) {
      this.profile = profile ? { ...profile } : null
      this.persistProfile()
    },
    clearProfile() {
      this.profile = null
      this.persistProfile()
    },
    async initialize(force = false) {
      if (this.initialized && !force) {
        return this.profile
      }

      try {
        await this.fetchCurrentUser()
      } catch (error) {
        const unauthorizedCodes = [-401, -403, 401, 403]

        if (unauthorizedCodes.includes(error.code)) {
          this.clearProfile()
        }

        if (!this.profile) {
          throw error
        }
      } finally {
        this.initialized = true
      }

      return this.profile
    },
    async fetchCurrentUser() {
      const profile = await getUserInfo()
      this.setProfile(profile)
      return profile
    },
    async login(payload) {
      const profile = await login(payload)
      this.setProfile(profile)
      this.initialized = true
      return profile
    },
    async register(payload) {
      return register(payload)
    },
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 后端不可达时兜底清除前端 cookie
        clearSessionCookies()
      }
      this.clearProfile()
      this.initialized = true
    }
  }
})