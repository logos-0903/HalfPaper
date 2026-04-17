/**
 * AI 慰问 composable
 * 实现日记详情页 AI 聊天功能：历史加载 -> SSE 流式对话 -> 打字机动画
 */
import { computed, inject, onBeforeUnmount, reactive, ref } from 'vue'
import { getAiDiaryHistory, postAiDiaryStream } from '@/services/ai'

const FADE_WAIT_MS = 260
const TYPE_INTERVAL_MS = 28

function parseJsonText(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function parseStreamEvent(line) {
  const trimmed = String(line || '').trim()

  if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) {
    return null
  }

  const payloadRaw = trimmed.slice(5).trim()
  if (!payloadRaw) {
    return null
  }

  const parsed = parseJsonText(payloadRaw)
  if (!parsed || typeof parsed !== 'object') {
    return { type: 'delta', content: payloadRaw }
  }

  return {
    type: String(parsed.type || '').trim(),
    content: String(parsed.content || '')
  }
}

function normalizeHistoryMessages(historyData) {
  const messages = Array.isArray(historyData?.messages) ? historyData.messages : []

  return messages
    .map((item) => ({
      role: item?.role === 'user' ? 'user' : 'assistant',
      content: String(item?.content || '').trim()
    }))
    .filter((item) => item.content)
}

export function useAiComfort() {
  const SnackBar = inject('snack', null)

  const generating = ref(false)
  const showSkeleton = ref(false)
  const showCard = ref(false)
  const messages = ref([])
  const draftMessage = ref('')
  const cursorVisible = ref(false)
  const typingMessageIndex = ref(-1)

  const state = reactive({
    diaryId: '',
    buffer: '',
    streamDone: false,
    cardEntered: false,
    doneContent: '',
    streamController: null,
    typingTimer: null,
    fadeTimer: null
  })

  const canSendMessage = computed(() => {
    return Boolean(state.diaryId) && showCard.value && !generating.value && state.streamDone
  })

  function stopTyping() {
    if (state.typingTimer) {
      window.clearInterval(state.typingTimer)
      state.typingTimer = null
    }
  }

  function stopFadeTimer() {
    if (state.fadeTimer) {
      window.clearTimeout(state.fadeTimer)
      state.fadeTimer = null
    }
  }

  function stopStream() {
    if (state.streamController) {
      state.streamController.abort()
      state.streamController = null
    }
  }

  function resetState() {
    stopTyping()
    stopFadeTimer()
    stopStream()

    messages.value = []
    draftMessage.value = ''
    typingMessageIndex.value = -1
    state.buffer = ''
    state.doneContent = ''
    state.streamDone = false
    state.cardEntered = false
    cursorVisible.value = false
    generating.value = false
  }

  function syncTypingState() {
    if (!state.cardEntered) {
      return
    }

    if (state.typingTimer) {
      return
    }

    state.typingTimer = window.setInterval(() => {
      if (!state.cardEntered) {
        stopTyping()
        return
      }

      if (state.buffer.length > 0) {
        const targetIndex = typingMessageIndex.value

        if (targetIndex < 0 || targetIndex >= messages.value.length) {
          stopTyping()
          cursorVisible.value = false
          return
        }

        messages.value[targetIndex].content += state.buffer.charAt(0)
        state.buffer = state.buffer.slice(1)
        cursorVisible.value = true
        return
      }

      if (state.streamDone) {
        stopTyping()
        cursorVisible.value = false
        typingMessageIndex.value = -1
      }
    }, TYPE_INTERVAL_MS)
  }

  function consumeStreamLine(line) {
    const event = parseStreamEvent(line)
    if (!event) {
      return
    }

    if (event.type === 'start') {
      return
    }

    if (event.type === 'done') {
      state.doneContent = event.content || state.doneContent

      if (!state.buffer && state.doneContent) {
        state.buffer = state.doneContent
      }

      state.streamDone = true
      syncTypingState()
      return
    }

    if (!event.content) {
      return
    }

    state.buffer += event.content
    syncTypingState()
  }

  async function consumeStream(response) {
    if (!response.body) {
      throw new Error('AI 接口未返回流数据')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let chunkBuffer = ''
    let hasAnyData = false

    while (true) {
      const readResult = await reader.read()
      const { done, value } = readResult

      if (done) {
        break
      }

      hasAnyData = true
      chunkBuffer += decoder.decode(value, { stream: true })

      const lines = chunkBuffer.split('\n')
      chunkBuffer = lines.pop() || ''
      lines.forEach(consumeStreamLine)
    }

    consumeStreamLine(chunkBuffer)

    if (!state.buffer && state.doneContent) {
      state.buffer = state.doneContent
    }

    if (!hasAnyData && !state.buffer) {
      throw new Error('AI 接口返回为空')
    }

    state.streamDone = true
    syncTypingState()
  }

  function appendMessage(role, content = '') {
    messages.value.push({ role, content })
    return messages.value.length - 1
  }

  function removeMessageAt(index) {
    if (index < 0 || index >= messages.value.length) {
      return
    }

    messages.value.splice(index, 1)
  }

  async function fetchHistory(diaryId) {
    try {
      return await getAiDiaryHistory(diaryId)
    } catch (error) {
      console.warn('[ai history load failed]', error)
      return null
    }
  }

  async function startAssistantReply({ diaryId, message = '', signal }) {
    const assistantIndex = appendMessage('assistant', '')

    typingMessageIndex.value = assistantIndex
    state.buffer = ''
    state.doneContent = ''
    state.streamDone = false
    cursorVisible.value = true

    const payload = {
      diary_id: diaryId,
      ...(message ? { message } : {})
    }

    let result = null

    try {
      result = await postAiDiaryStream(payload, { signal })
    } catch (error) {
      const target = messages.value[assistantIndex]

      if (target && !String(target.content || '').trim()) {
        removeMessageAt(assistantIndex)
      }

      typingMessageIndex.value = -1
      throw error
    }

    if (result?.mode === 'json') {
      state.buffer += String(result.content || '')
      state.streamDone = true
      syncTypingState()
      return
    }

    try {
      await consumeStream(result.response)
    } catch (error) {
      const target = messages.value[assistantIndex]

      if (target && !String(target.content || '').trim()) {
        removeMessageAt(assistantIndex)
      }

      typingMessageIndex.value = -1
      throw error
    }
  }

  async function openStream(diaryId) {
    const queryDiaryId = String(diaryId || '').trim()

    if (!queryDiaryId) {
      SnackBar?.({
        text: '缺少日记 ID，无法生成回复',
        color: 'warning',
        icon: 'mdi-alert-outline'
      })
      return
    }

    const incomingDiaryId = queryDiaryId
    const shouldReset = state.diaryId !== incomingDiaryId

    if (shouldReset) {
      resetState()
    }

    state.diaryId = incomingDiaryId
    showSkeleton.value = true
    showCard.value = false
    generating.value = true
    cursorVisible.value = false

    const controller = new AbortController()
    state.streamController = controller

    state.fadeTimer = window.setTimeout(() => {
      showSkeleton.value = false
      showCard.value = true
    }, FADE_WAIT_MS)

    try {
      const history = await fetchHistory(incomingDiaryId)
      const historyMessages = normalizeHistoryMessages(history)

      if (historyMessages.length) {
        messages.value = historyMessages
        state.streamDone = true
        cursorVisible.value = false
        return
      }

      await startAssistantReply({ diaryId: incomingDiaryId, signal: controller.signal })
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }

      console.error('[ai comfort stream error]', error)
      showSkeleton.value = false
      showCard.value = false

      const message = String(error?.message || '').trim()
      const isFailedToFetch = /failed\s+to\s+fetch/i.test(message)

      SnackBar?.({
        text: isFailedToFetch
          ? 'AI 请求失败（failed to fetch），请检查后端服务、HTTPS 证书或跨域配置'
          : (message || 'AI 回复生成失败，请稍后重试'),
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      state.streamDone = true
      state.streamController = null
      generating.value = false
      showSkeleton.value = showCard.value ? false : showSkeleton.value
      syncTypingState()
    }
  }

  async function sendMessage() {
    const content = String(draftMessage.value || '').trim()

    if (!content || !state.diaryId || generating.value) {
      return
    }

    appendMessage('user', content)
    draftMessage.value = ''
    generating.value = true

    const controller = new AbortController()
    state.streamController = controller

    try {
      await startAssistantReply({ diaryId: state.diaryId, message: content, signal: controller.signal })
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }

      console.error('[ai comfort send message error]', error)

      const message = String(error?.message || '').trim()
      const isFailedToFetch = /failed\s+to\s+fetch/i.test(message)

      SnackBar?.({
        text: isFailedToFetch
          ? 'AI 请求失败（failed to fetch），请检查后端服务、HTTPS 证书或跨域配置'
          : (message || '发送失败，请稍后重试'),
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      state.streamDone = true
      state.streamController = null
      generating.value = false
      syncTypingState()
    }
  }

  function onCardAfterEnter() {
    state.cardEntered = true
    cursorVisible.value = true
    syncTypingState()
  }

  function closeCard() {
    resetState()
    showSkeleton.value = false
    showCard.value = false
    state.diaryId = ''
  }

  async function regenerate() {
    if (!state.diaryId || generating.value || messages.value.length) {
      SnackBar?.({
        text: '请输入内容后发送，继续和 AI 对话',
        color: 'info',
        icon: 'mdi-information-outline'
      })
      return
    }

    await openStream(state.diaryId)
  }

  onBeforeUnmount(() => {
    closeCard()
  })

  return {
    generating,
    showSkeleton,
    showCard,
    messages,
    draftMessage,
    canSendMessage,
    typingMessageIndex,
    cursorVisible,
    openStream,
    sendMessage,
    onCardAfterEnter,
    closeCard,
    regenerate
  }
}
