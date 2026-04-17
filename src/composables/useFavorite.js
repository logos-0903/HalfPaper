import { ref } from 'vue'
import { toggleFavorite as toggleFavoriteApi, listFavorites as listFavoritesApi } from '@/services/api'

const favoriteDrawer = ref(false)
const favorites = ref([])
const loadingFavorites = ref(false)

export function useFavorite() {
  async function toggleFavorite(diary, { onError } = {}) {
    const previous = diary.is_favorited
    diary.is_favorited = !previous

    try {
      await toggleFavoriteApi(diary.id)
    } catch (error) {
      diary.is_favorited = previous
      onError?.(error)
    }
  }

  async function loadFavorites() {
    loadingFavorites.value = true

    try {
      const data = await listFavoritesApi({ ps: 50 })
      favorites.value = data.lists || []
    } catch {
      favorites.value = []
    } finally {
      loadingFavorites.value = false
    }
  }

  function openFavoriteDrawer() {
    favoriteDrawer.value = true
    loadFavorites()
  }

  return {
    favoriteDrawer,
    favorites,
    loadingFavorites,
    toggleFavorite,
    loadFavorites,
    openFavoriteDrawer
  }
}
