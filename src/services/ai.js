import { API_BASE_URL } from '@/constants/app'
import { ApiError, request } from './http'

export function getAiDiaryHistory(diaryId) {
  return request({
    url: '/ai/diary/history',
    method: 'get',
    params: { diary_id: diaryId }
  })
}

export async function postAiDiaryStream(payload = {}, options = {}) {
  const response = await fetch(`${API_BASE_URL}/ai/diary/stream`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    credentials: 'include',
    signal: options.signal,
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    let message = `AI 请求失败（${response.status}）`

    try {
      const text = await response.text()
      const parsed = JSON.parse(text)
      message = parsed?.message || message
    } catch {
      // Keep fallback message.
    }

    throw new ApiError(message, response.status)
  }

  const contentType = String(response.headers.get('content-type') || '').toLowerCase()

  if (contentType.includes('application/json')) {
    let parsed = null

    try {
      parsed = await response.json()
    } catch {
      throw new ApiError('AI 接口返回 JSON 解析失败', -1)
    }

    const code = Number(parsed?.code)
    const message = String(parsed?.message || 'AI 请求失败').trim()

    if (Number.isFinite(code) && code !== 0) {
      throw new ApiError(message, code, parsed)
    }

    const content = String(parsed?.data?.content || '').trim()

    if (!content) {
      throw new ApiError(message || 'AI 接口未返回流内容', Number.isFinite(code) ? code : -1, parsed)
    }

    return {
      mode: 'json',
      content
    }
  }

  return {
    mode: 'stream',
    response
  }
}
