export const APP_NAME = '半页纸'
export const API_BASE_URL = 'https://api.halfpaper.top'
export const HCAPTCHA_SITE_KEY = 'e67e63f0-7a40-4abe-8b5c-8722a5a8824a'

export const VISIBILITY_OPTIONS = [
  { title: '仅自己可见', value: 'private' },
  { title: '粉丝可见', value: 'fans' },
  { title: '好友可见', value: 'friends' },
  { title: '公开', value: 'public' }
]

export const WEATHER_OPTIONS = [
  '晴',
  '阴',
  '多云',
  '小雨',
  '雷阵雨',
  '雪',
  '大风'
].map((item) => ({ title: item, value: item }))

export const MOOD_OPTIONS = [
  '平静',
  '开心',
  '专注',
  '疲惫',
  '想念',
  '失眠',
  '期待'
].map((item) => ({ title: item, value: item }))

export const THEME_OPTIONS = [
  { title: '浅色纸页', value: 'halfpaperLight' },
  { title: '深色夜读', value: 'halfpaperDark' }
]

export const DIARY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50].map((value) => ({
  title: `${value} 条 / 页`,
  value
}))