import { defineStore } from 'pinia'
import { getUserInfo, login, register } from '@/services/api'
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
    logout() {
      clearSessionCookies()
      this.clearProfile()
      this.initialized = true
    }
  }
})