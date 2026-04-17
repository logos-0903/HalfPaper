import { API_BASE_URL } from '@/constants/app'

/**
 * 解析后端 images 字段，兼容 JSON 字符串 / 数组 / 单字符串
 * 后端可能返回 stringified JSON、原始数组或单个 URL 字符串
 */
export function parseImagesField(images) {
  if (!images) return []

  let parsed = images

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      parsed = [parsed]
    }
  }

  return Array.isArray(parsed) ? parsed : []
}

/**
 * 将相对路径或文件名拼接为完整的资源 URL
 * 已是完整 URL（http/blob/data）则原样返回
 */
export function resolveImageUrl(raw) {
  const value = String(raw || '').trim()

  if (!value) return ''
  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value) || /^data:/i.test(value)) return value
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`

  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`
}

/**
 * 从单条 image 记录中提取原始路径
 * 兼容纯字符串和 { url / src / filename } 对象两种格式
 */
function extractRawUrl(item) {
  return typeof item === 'string'
    ? item
    : item?.url || item?.src || item?.filename || ''
}

/**
 * 解析图片列表并转为 { url } 数组（已过滤空值）
 */
export function normalizeImageList(images) {
  return parseImagesField(images)
    .map((item) => {
      const url = resolveImageUrl(extractRawUrl(item))
      return url ? { url } : null
    })
    .filter(Boolean)
}

/**
 * 提取日记卡片缩略图（默认最多 3 张），返回 { raw, url }
 */
export function extractCardImages(item, maxCount = 3) {
  return parseImagesField(item?.images)
    .map((img) => {
      const raw = extractRawUrl(img)
      const url = resolveImageUrl(raw)
      return url ? { raw, url } : null
    })
    .filter(Boolean)
    .slice(0, maxCount)
}

/**
 * 计算超出卡片显示数量的图片数
 */
export function extraImageCount(item, maxCount = 3) {
  return Math.max(0, parseImagesField(item?.images).length - maxCount)
}
