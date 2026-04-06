export function formatDate(value) {
  if (!value) {
    return '未设置'
  }

  const date = typeof value === 'number' && value < 1000000000000
    ? new Date(value * 1000)
    : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '未设置'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
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