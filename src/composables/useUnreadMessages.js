import { ref, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { getUnreadMessageCount } from '@/services/api'

const POLL_INTERVAL = 30_000 // 30 秒

// ── 全局共享状态 ──
const unreadCount = ref(0)
let timerId = null
let subscribers = 0

async function fetchCount() {
  try {
    const data = await getUnreadMessageCount()
    unreadCount.value = Number(data?.all || 0)
  } catch {
    // 静默失败，不影响用户操作
  }
}

function startPolling() {
  if (timerId) return
  fetchCount()
  timerId = setInterval(fetchCount, POLL_INTERVAL)
}

function stopPolling() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

/**
 * 提供全局未读消息数，自动轮询。
 * 在任何组件中调用即可获取 unreadCount。
 */
export function useUnreadMessages() {
  const authStore = useAuthStore()
  const { isLoggedIn } = storeToRefs(authStore)

  subscribers++

  // 登录状态变化时启停轮询
  const stopWatch = watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
      startPolling()
    } else {
      stopPolling()
      unreadCount.value = 0
    }
  }, { immediate: true })

  onUnmounted(() => {
    subscribers--
    stopWatch()
    if (subscribers <= 0) {
      stopPolling()
      subscribers = 0
    }
  })

  return {
    unreadCount,
    /** 手动刷新（如阅读消息后调用） */
    refresh: fetchCount
  }
}
