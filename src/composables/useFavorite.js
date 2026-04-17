/**
 * 收藏功能 composable
 * 提供收藏/取消收藏的乐观更新逻辑以及收藏列表加载
 */
import { ref } from 'vue'
import {
  favoriteDiary,
  unfavoriteDiary,
  listFavorites as listFavoritesApi
} from '@/services/api'

const favoriteDrawer = ref(false)
const favorites = ref([])
const loadingFavorites = ref(false)
const favoriteTotal = ref(0)
const favoritePage = ref(1)
const favoritePageSize = ref(20)

export function useFavorite() {
  async function toggleFavorite(diary, { onError, onChange } = {}) {
    const previous = Boolean(diary?.is_favorited)
    const previousCount = Number(diary?.favorite_count || 0)
    const nextFavorited = !previous

    diary.is_favorited = nextFavorited
    diary.favorite_count = Math.max(0, previousCount + (nextFavorited ? 1 : -1))

    try {
      const data = nextFavorited
        ? await favoriteDiary(diary.id)
        : await unfavoriteDiary(diary.id)

      if (data && typeof data === 'object') {
        diary.is_favorited = Boolean(data.is_favorited)
        diary.favorite_count = Number(data.favorite_count ?? diary.favorite_count ?? 0)
      }

      onChange?.({
        diary,
        isFavorited: Boolean(diary.is_favorited)
      })
    } catch (error) {
      diary.is_favorited = previous
      diary.favorite_count = previousCount
      onError?.(error)
    }
  }

  async function loadFavorites(params = {}) {
    const requestedPage = Number(params.pn ?? favoritePage.value ?? 1)
    const requestedPageSize = Number(params.ps ?? favoritePageSize.value ?? 20)

    loadingFavorites.value = true

    try {
      const data = await listFavoritesApi({
        pn: requestedPage,
        ps: requestedPageSize
      })

      favorites.value = (data?.lists || []).map((item) => ({
        ...item,
        is_favorited: true
      }))
      favoriteTotal.value = Number(data?.total ?? favorites.value.length)
      favoritePage.value = Number(data?.pn ?? requestedPage)
      favoritePageSize.value = Number(data?.ps ?? requestedPageSize)

      return {
        lists: favorites.value,
        total: favoriteTotal.value,
        pn: favoritePage.value,
        ps: favoritePageSize.value
      }
    } catch (error) {
      favorites.value = []
      favoriteTotal.value = 0
      favoritePage.value = requestedPage
      favoritePageSize.value = requestedPageSize
      throw error
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
    favoriteTotal,
    favoritePage,
    favoritePageSize,
    toggleFavorite,
    loadFavorites,
    openFavoriteDrawer
  }
}
