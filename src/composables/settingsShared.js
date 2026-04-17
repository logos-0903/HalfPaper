export const SETTINGS_STORAGE_KEYS = {
  allowComment: 'halfpaper.settings.allowComment',
  privacyDefaultVisibility: 'halfpaper.settings.privacyDefaultVisibility',
  syncEditorVisibility: 'halfpaper.settings.syncEditorVisibility'
}

export const SETTINGS_VISIBILITY_ITEMS = [
  { title: '公开', value: 'public' },
  { title: '私密', value: 'private' }
]

export function readBooleanStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = localStorage.getItem(key)
  if (raw === null) {
    return fallback
  }

  return raw === '1'
}

export function writeBooleanStorage(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(key, value ? '1' : '0')
}

export function readStringStorage(key, fallback, allowedValues = []) {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = String(localStorage.getItem(key) || '').trim()
  if (!raw) {
    return fallback
  }

  if (allowedValues.length && !allowedValues.includes(raw)) {
    return fallback
  }

  return raw
}

export function writeStringStorage(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(key, String(value || ''))
}
