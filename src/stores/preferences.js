import { defineStore } from 'pinia'

const THEME_KEY = 'halfpaper.theme'
const PAGE_SIZE_KEY = 'halfpaper.pageSize'
const SEARCH_HISTORY_KEY = 'halfpaper.searchHistory'

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'halfpaperLight'
  }

  const cachedTheme = localStorage.getItem(THEME_KEY)

  if (cachedTheme) {
    return cachedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'halfpaperDark' : 'halfpaperLight'
}

function getInitialPageSize() {
  if (typeof window === 'undefined') {
    return 20
  }

  const cachedPageSize = Number(localStorage.getItem(PAGE_SIZE_KEY))
  return Number.isFinite(cachedPageSize) && cachedPageSize > 0 ? cachedPageSize : 20
}

function getInitialSearchHistory() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const cached = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    themeName: getInitialTheme(),
    diaryPageSize: getInitialPageSize(),
    searchHistory: getInitialSearchHistory()
  }),
  actions: {
    setTheme(themeName) {
      this.themeName = themeName
      localStorage.setItem(THEME_KEY, themeName)
    },
    toggleTheme() {
      this.setTheme(this.themeName === 'halfpaperDark' ? 'halfpaperLight' : 'halfpaperDark')
    },
    setDiaryPageSize(pageSize) {
      this.diaryPageSize = pageSize
      localStorage.setItem(PAGE_SIZE_KEY, String(pageSize))
    },
    addSearchKeyword(keyword) {
      const value = keyword.trim()

      if (!value) {
        return
      }

      this.searchHistory = [value, ...this.searchHistory.filter((item) => item !== value)].slice(0, 8)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory))
    },
    clearSearchHistory() {
      this.searchHistory = []
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    }
  }
})