import { inject, ref } from 'vue'
import { API_BASE_URL } from '@/constants/app'
import { listDiaries } from '@/services/api'
import { summarizeText } from '@/utils/format'

const FEED_PAGE_SIZE = 20
const HOT_PAGE_SIZE = 60

const FIREFLY_TAB_ITEMS = [
  { title: '最新', value: 'latest' },
  { title: '热门', value: 'hot' },
  { title: '关注', value: 'follow' }
]

const FIREFLY_TAG_ITEMS = [
  { title: '全部', value: 'all' },
  { title: '#今夜难眠', value: 'insomnia' },
  { title: '#想家', value: 'homesick' },
  { title: '#一个人', value: 'alone' },
  { title: '#小确幸', value: 'little-joy' },
  { title: '#发泄', value: 'vent' },
  { title: '#碎碎念', value: 'murmur' },
  { title: '#成长', value: 'growth' }
]

const TAG_RULES = {
  insomnia: ['失眠', '睡不着', '夜里', '凌晨', '今夜'],
  homesick: ['想家', '家乡', '回家', '爸妈', '故乡'],
  alone: ['一个人', '独自', '孤单', '孤独'],
  'little-joy': ['开心', '满足', '幸运', '治愈', '小确幸'],
  vent: ['烦', '压力', '崩溃', '发泄', '难受'],
  murmur: ['碎碎念', '日常', '随手记', '今天', '琐事'],
  growth: ['成长', '复盘', '学习', '进步', '目标']
}

function toSafeNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function parseImagesField(images) {
  if (!images) {
    return []
  }

  let parsed = images

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      parsed = [parsed]
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
}

function resolveImageUrl(raw) {
  const value = String(raw || '').trim()

  if (!value) {
    return ''
  }

  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value) || /^data:/i.test(value)) {
    return value
  }

  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`
  }

  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`
}

function normalizeImageList(images) {
  return parseImagesField(images)
    .map((item) => {
      const raw = typeof item === 'string'
        ? item
        : item?.url || item?.src || item?.filename || ''

      const url = resolveImageUrl(raw)

      if (!url) {
        return null
      }

      return { url }
    })
    .filter(Boolean)
}

function resolveTagValue(inputText) {
  const text = String(inputText || '').toLowerCase()

  if (!text) {
    return 'murmur'
  }

  for (const [tag, words] of Object.entries(TAG_RULES)) {
    if (words.some((word) => text.includes(String(word).toLowerCase()))) {
      return tag
    }
  }

  return 'murmur'
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
  const textForTag = `${title} ${summary} ${mood}`
  const tag = resolveTagValue(textForTag)
  const images = normalizeImageList(item?.images)

  return {
    id,
    title,
    preview: summarizeText(summary, 180),
    createdAt: item?.updated_at || item?.created_at || '',
    authorName: String(item?.member?.username || item?.username || '萤火用户'),
    authorInitial: String(item?.member?.username || item?.username || '萤').slice(0, 1),
    authorAvatar: resolveImageUrl(item?.member?.avatar || item?.avatar || ''),
    likeCount: toSafeNumber(item?.like_count, 0),
    commentCount: toSafeNumber(item?.comment_count, 0),
    liked: Boolean(item?.is_liked),
    mood,
    fireflyTag: tag,
    imageLayout: buildImageLayout(images)
  }
}

function sortFeedItems(items, tab) {
  if (tab === 'hot') {
    return [...items].sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount))
  }

  if (tab === 'follow') {
    return [...items].filter((item) => item.fireflyTag === 'growth' || item.fireflyTag === 'little-joy')
  }

  return [...items]
}

function filterByTag(items, tag) {
  if (tag === 'all') {
    return items
  }

  return items.filter((item) => item.fireflyTag === tag)
}

export function useFirefly() {
  const SnackBar = inject('snack', null)

  const loadingFeed = ref(false)
  const loadingHotList = ref(false)
  const feedList = ref([])
  const feedTotal = ref(0)
  const hotList = ref([])
  const activeTab = ref('latest')
  const activeTag = ref('all')

  async function fetchFeed(tab = activeTab.value, tag = activeTag.value, page = 1, pageSize = FEED_PAGE_SIZE) {
    loadingFeed.value = true

    try {
      const data = await listDiaries({
        pn: page,
        ps: pageSize,
        status: 'active'
      })

      const normalized = (data?.lists || []).map((item, index) => normalizeDiaryItem(item, index))
      const sorted = sortFeedItems(normalized, tab)
      const filtered = filterByTag(sorted, tag)

      feedList.value = filtered
      feedTotal.value = Number(data?.total || 0)
      activeTab.value = tab
      activeTag.value = tag
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

  function toggleLike(diaryId) {
    if (!diaryId) {
      return
    }

    const syncLike = (target) => {
      if (!target || target.id !== diaryId) {
        return target
      }

      const nextLiked = !target.liked
      const nextCount = Math.max(0, target.likeCount + (nextLiked ? 1 : -1))

      return {
        ...target,
        liked: nextLiked,
        likeCount: nextCount
      }
    }

    feedList.value = feedList.value.map(syncLike)
    hotList.value = hotList.value.map((item) => {
      if (item.id !== diaryId) {
        return item
      }

      const nextLiked = !item.liked
      const nextCount = Math.max(0, item.likeCount + (nextLiked ? 1 : -1))

      return {
        ...item,
        liked: nextLiked,
        likeCount: nextCount
      }
    })
  }

  async function fetchHotList() {
    loadingHotList.value = true

    try {
      const data = await listDiaries({
        pn: 1,
        ps: HOT_PAGE_SIZE,
        status: 'active'
      })

      const normalized = (data?.lists || []).map((item, index) => normalizeDiaryItem(item, index))

      hotList.value = normalized
        .sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount))
        .slice(0, 8)
        .map((item, index) => ({
          id: item.id,
          rank: index + 1,
          title: item.title,
          likeCount: item.likeCount,
          liked: item.liked
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
    feedList,
    feedTotal,
    hotList,
    activeTab,
    fetchFeed,
    toggleLike,
    fetchHotList
  }
}