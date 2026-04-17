function toDate(value) {
  if (!value) {
    return null
  }

  const date = typeof value === 'number' && value < 1000000000000
    ? new Date(value * 1000)
    : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function formatDate(value) {
  const date = toDate(value)

  if (!date) {
    return '未设置'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export function formatDateWithSeconds(value) {
  const date = toDate(value)

  if (!date) {
    return '未设置'
  }

  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hour = pad2(date.getHours())
  const minute = pad2(date.getMinutes())
  const second = pad2(date.getSeconds())

  return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`
}

export function isDiaryUpdated(createdAt, updatedAt) {
  const updatedDate = toDate(updatedAt)

  if (!updatedDate) {
    return false
  }

  const createdDate = toDate(createdAt)

  if (!createdDate) {
    return true
  }

  return updatedDate.getTime() > createdDate.getTime()
}

export function getDiaryPrimaryTime(createdAt, updatedAt) {
  if (isDiaryUpdated(createdAt, updatedAt)) {
    return {
      label: '修改于',
      value: formatDateWithSeconds(updatedAt)
    }
  }

  return {
    label: '创建于',
    value: formatDateWithSeconds(createdAt)
  }
}

export function summarizeText(text, limit = 120) {
  const value = (text || '').trim()

  if (!value) {
    return '这一天还没有写下正文。'
  }

  return value.length > limit ? `${value.slice(0, limit)}...` : value
}

export function toDisplayText(value, fallback = '未填写') {
  return value || fallback
}