/**
 * 登录设备管理 composable
 * 显示活跃会话列表，支持单台下线或全部退登
 */
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSessionList, revokeAllSessions, revokeSession } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

function normalizeSession(item) {
  return {
    session_id: String(item?.session_id || ''),
    location: String(item?.location || '未知地区'),
    ip: String(item?.ip || '未知 IP'),
    application: String(item?.application || '未知设备'),
    created_at: item?.created_at ?? null,
    last_seen_at: item?.last_seen_at ?? null,
    is_current: Boolean(item?.is_current)
  }
}

export function useSessionSettings() {
  const SnackBar = inject('snack', null)
  const router = useRouter()
  const authStore = useAuthStore()

  const sessions = ref([])
  const loadingSessions = ref(false)
  const revokingSessionId = ref('')
  const revokingAllSessions = ref(false)

  async function loadSessions() {
    loadingSessions.value = true

    try {
      const data = await getSessionList()
      sessions.value = Array.isArray(data?.list) ? data.list.map(normalizeSession) : []
      return sessions.value
    } catch (error) {
      console.error('[session settings load sessions error]', error)
      SnackBar?.({
        text: error?.message || '获取登录会话失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
      throw error
    } finally {
      loadingSessions.value = false
    }
  }

  async function leaveCurrentRoute() {
    authStore.clearProfile()
    await router.replace({
      path: '/login',
      query: {
        redirect: '/settings/security'
      }
    })
  }

  async function revokeSingleSession(session) {
    const sessionId = String(session?.session_id || '')

    if (!sessionId || revokingSessionId.value || revokingAllSessions.value) {
      return
    }

    revokingSessionId.value = sessionId

    try {
      await revokeSession(sessionId)

      if (session?.is_current) {
        SnackBar?.({
          text: '当前设备已下线，请重新登录',
          color: 'info',
          icon: 'mdi-logout'
        })
        await leaveCurrentRoute()
        return
      }

      sessions.value = sessions.value.filter((item) => item.session_id !== sessionId)

      SnackBar?.({
        text: '会话已下线',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })
    } catch (error) {
      console.error('[session settings revoke session error]', error)
      SnackBar?.({
        text: error?.message || '会话下线失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      revokingSessionId.value = ''
    }
  }

  async function revokeAllUserSessions() {
    if (revokingAllSessions.value || revokingSessionId.value) {
      return
    }

    revokingAllSessions.value = true

    try {
      await revokeAllSessions()
      SnackBar?.({
        text: '所有设备已退登，请重新登录',
        color: 'info',
        icon: 'mdi-logout'
      })
      await leaveCurrentRoute()
    } catch (error) {
      console.error('[session settings revoke all sessions error]', error)
      SnackBar?.({
        text: error?.message || '全部退登失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      revokingAllSessions.value = false
    }
  }

  return {
    sessions,
    loadingSessions,
    revokingSessionId,
    revokingAllSessions,
    loadSessions,
    revokeSingleSession,
    revokeAllUserSessions
  }
}