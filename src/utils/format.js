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

function toSafeNumber(value, fallback = 0) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : fallback
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

export function normalizeLevelInfo(level, expValue) {
  const currentExp = Math.max(0, toSafeNumber(expValue ?? level?.exp, 0))
  const levelNumber = Math.max(1, toSafeNumber(level?.level, 1))
  const levelName = String(level?.level_name || `Lv.${levelNumber}`)
  const levelMinExp = Math.max(0, toSafeNumber(level?.level_min_exp, 0))
  const isMaxLevel = Boolean(level?.is_max_level)
  const rawNextLevelExp = toSafeNumber(level?.next_level_exp, currentExp)
  const nextLevelExp = isMaxLevel ? currentExp : Math.max(rawNextLevelExp, currentExp)
  const range = Math.max(0, nextLevelExp - levelMinExp)

  let progressRatio = Number(level?.progress)

  if (!Number.isFinite(progressRatio)) {
    progressRatio = range > 0 ? (currentExp - levelMinExp) / range : 1
  }

  progressRatio = Math.min(1, Math.max(0, progressRatio))

  return {
    levelNumber,
    levelName,
    currentExp,
    levelMinExp,
    nextLevelExp,
    isMaxLevel,
    progressRatio,
    progressPercent: Math.round(progressRatio * 100),
    progressText: isMaxLevel
      ? `当前经验 ${currentExp}，已达到最高等级`
      : `当前经验 ${currentExp} / 下一等级 ${nextLevelExp}`
  }
}