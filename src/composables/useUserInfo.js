import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/app'
import { useAuthStore } from '@/stores/auth'
import { formatDate, toDisplayText } from '@/utils/format'

export function useUserInfo() {
  const router = useRouter()
  const authStore = useAuthStore()

  const { profile } = storeToRefs(authStore)

  const avatarUrl = computed(() => resolveAvatarUrl(profile.value?.avatar))

  const statsCards = computed(() => [
    { label: '日记', value: profile.value?.diary_count ?? 0 },
    { label: '好友', value: profile.value?.friend_count ?? 0 },
  ])

  const profileRows = computed(() => [
    { label: '用户名', value: toDisplayText(profile.value?.username) },
    { label: '邮箱', value: toDisplayText(profile.value?.email) },
    { label: '学校', value: toDisplayText(profile.value?.school) },
    { label: '性别', value: toDisplayText(profile.value?.sex) },
    { label: '生日', value: formatBirthday(profile.value?.birthday) },
    { label: '个性签名', value: toDisplayText(profile.value?.sign) },
    { label: '注册时间', value: formatDate(profile.value?.created_at) }
  ])

  function goToEditor() {
    router.push('/user/edit')
  }

  function resolveAvatarUrl(value) {
    const avatar = String(value || '').trim()

    if (!avatar) {
      return ''
    }

    if (/^https?:\/\//i.test(avatar) || /^blob:/i.test(avatar) || /^data:/i.test(avatar)) {
      return avatar
    }

    if (avatar.startsWith('/')) {
      return `${API_BASE_URL}${avatar}`
    }

    return `${API_BASE_URL}/${avatar.replace(/^\/+/, '')}`
  }

  function formatBirthday(value) {
    if (!value) {
      return '未填写'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return toDisplayText(value)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  return {
    profile,
    avatarUrl,
    statsCards,
    profileRows,
    goToEditor
  }
}
