/**
 * 萤火社区 composable
 * 公开日记信息流、热门话题、搜索及收藏交互
 */
import { inject, ref } from 'vue'
import {
  favoriteDiary,
  getFireflyHotTopics,
  getFireflyTopicList,
  listFireflies,
  searchFireflies,
  unfavoriteDiary
} from '@/services/api'
import { summarizeText } from '@/utils/format'
import { normalizeImageList, resolveImageUrl } from '@/utils/image'

const FEED_PAGE_SIZE = 20

const FIREFLY_TAB_ITEMS = [{ title: '最新', value: 'latest' }, { title: '热门', value: 'hot' }]

function toSafeNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function buildImageLayout(images) {
  const total = images.length

  if (!total) {
    return {
      hasImages: false,
      single: false,
      cols: 12,
      items: []
    }
  }

  if (total === 1) {
    return {
      hasImages: true,
      single: true,
      cols: 12,
      items: [
        {
          url: images[0].url,
          overlayText: ''
        }
      ]
    }
  }

  let cols = 4

  if (total === 2) {
    cols = 6
  }

  if (total === 4) {
    cols = 6
  }

  const visibleCount = total > 6 ? 6 : total
  const overflow = total > 6 ? total - 6 : 0

  const items = images
    .slice(0, visibleCount)
    .map((item, index) => {
      const isOverlay = overflow > 0 && index === visibleCount - 1

      return {
        url: item.url,
        overlayText: isOverlay ? `+${overflow}` : ''
      }
    })

  return {
    hasImages: true,
    single: false,
    cols,
    items
  }
}

function normalizeDiaryItem(item, index = 0) {
  const id = item?.id || `firefly-${index}`
  const title = String(item?.title || '').trim() || '无标题日记'
  const summary = String(item?.summary || item?.content || '').trim()
  const mood = String(item?.mood || '').trim()
  const images = normalizeImageList(item?.images)
  const author = item?.author || item?.member || null
  const authorName = String(author?.username || item?.username || '萤火用户')

  return {
    id,
    title,
    preview: summarizeText(summary, 180),
    createdAt: item?.published_at || item?.updated_at || item?.created_at || '',
    authorName,
    authorInitial: authorName.slice(0, 1) || '萤',
    authorAvatar: resolveImageUrl(author?.avatar || item?.avatar || ''),
    likeCount: toSafeNumber(item?.like_count, 0),
    favoriteCount: toSafeNumber(item?.favorite_count, 0),
    commentCount: toSafeNumber(item?.comment_count, 0),
    isFavorited: Boolean(item?.is_favorited),
    mood,
    weather: String(item?.weather || '').trim(),
    topicId: item?.topic?.id ?? item?.topic_id ?? null,
    topicName: String(item?.topic?.name || '').trim(),
    topicDesc: String(item?.topic?.desc || '').trim(),
    imageLayout: buildImageLayout(images)
  }
}

export function useFirefly() {
  const SnackBar = inject('snack', null)

  const loadingFeed = ref(false)
  const loadingHotList = ref(false)
  const loadingTopics = ref(false)
  const feedList = ref([])
  const feedTotal = ref(0)
  const hotList = ref([])
  const topicList = ref([])
  const activeTab = ref('latest')
  const activeTopicId = ref(null)
  const searchKeyword = ref('')

  async function fetchFeed({
    tab = activeTab.value,
    topicId = activeTopicId.value,
    keyword = searchKeyword.value,
    page = 1,
    pageSize = FEED_PAGE_SIZE
  } = {}) {
    loadingFeed.value = true

    try {
      const trimmedKeyword = String(keyword || '').trim()
      const params = {
        pn: page,
        ps: pageSize,
        topic_id: topicId || undefined
      }
      const data = trimmedKeyword
        ? await searchFireflies({
          ...params,
          q: trimmedKeyword
        })
        : await listFireflies({
          ...params,
          sort: tab
        })

      feedList.value = (data?.lists || []).map((item, index) => normalizeDiaryItem(item, index))
      feedTotal.value = Number(data?.total || 0)
      activeTab.value = tab
      activeTopicId.value = topicId || null
      searchKeyword.value = trimmedKeyword

      if (!topicList.value.length && Array.isArray(data?.topics) && data.topics.length) {
        topicList.value = data.topics.map((item) => ({
          id: item?.id,
          name: item?.name || `话题 ${item?.id ?? ''}`,
          desc: item?.desc || ''
        }))
      }
    } catch (error) {
      feedList.value = []
      feedTotal.value = 0

      SnackBar?.({
        text: error.message || '读取萤火集信息流失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      loadingFeed.value = false
    }
  }

  async function fetchTopicList() {
    loadingTopics.value = true

    try {
      const data = await getFireflyTopicList()
      topicList.value = (data?.list || []).map((item) => ({
        id: item?.id,
        name: item?.name || `话题 ${item?.id ?? ''}`,
        desc: item?.desc || ''
      }))
    } catch (error) {
      topicList.value = []
      SnackBar?.({
        text: error.message || '获取话题列表失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      loadingTopics.value = false
    }
  }

  async function toggleFavorite(diary) {
    if (!diary?.id) {
      return
    }

    const previousFavorited = Boolean(diary.isFavorited)
    const previousCount = Number(diary.favoriteCount || 0)
    const nextFavorited = !previousFavorited

    diary.isFavorited = nextFavorited
    diary.favoriteCount = Math.max(0, previousCount + (nextFavorited ? 1 : -1))

    try {
      const data = nextFavorited
        ? await favoriteDiary(diary.id)
        : await unfavoriteDiary(diary.id)

      if (data && typeof data === 'object') {
        diary.isFavorited = Boolean(data.is_favorited)
        diary.favoriteCount = Number(data.favorite_count ?? diary.favoriteCount ?? 0)
      }
    } catch (error) {
      diary.isFavorited = previousFavorited
      diary.favoriteCount = previousCount

      SnackBar?.({
        text: error.message || '收藏操作失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    }
  }

  async function fetchHotList() {
    loadingHotList.value = true

    try {
      const data = await getFireflyHotTopics({ limit: 8 })

      hotList.value = (data?.list || []).map((item, index) => ({
        id: item?.id,
        rank: Number(item?.rank || index + 1),
        name: item?.name || `话题 ${item?.id ?? ''}`,
        desc: item?.desc || '',
        diaryCount: toSafeNumber(item?.diary_count, 0),
        heatScore: Number(item?.heat_score || 0)
      }))
    } catch (error) {
      hotList.value = []

      SnackBar?.({
        text: error.message || '读取今日热门失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      loadingHotList.value = false
    }
  }

  return {
    tabItems: FIREFLY_TAB_ITEMS,
    loadingFeed,
    loadingHotList,
    loadingTopics,
    feedList,
    feedTotal,
    hotList,
    topicList,
    activeTab,
    activeTopicId,
    searchKeyword,
    fetchFeed,
    fetchTopicList,
    toggleFavorite,
    fetchHotList
  }
}