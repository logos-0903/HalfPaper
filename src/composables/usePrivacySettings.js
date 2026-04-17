import { inject, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { deleteDiary, listDiaries } from '@/services/api'
import {
  SETTINGS_STORAGE_KEYS,
  SETTINGS_VISIBILITY_ITEMS,
  readBooleanStorage,
  readStringStorage,
  writeBooleanStorage,
  writeStringStorage
} from '@/composables/settingsShared'

export function usePrivacySettings() {
  const SnackBar = inject('snack', null)

  const allowDiaryComments = ref(readBooleanStorage(SETTINGS_STORAGE_KEYS.allowComment, true))
  const privacyDefaultVisibility = ref(
    readStringStorage(SETTINGS_STORAGE_KEYS.privacyDefaultVisibility, 'private', ['public', 'private'])
  )

  const clearDiaryDialog = ref(false)
  const clearingAllDiaries = ref(false)
  const privacyAlert = reactive({
    show: false,
    type: 'info',
    text: ''
  })

  let alertTimer = null

  onBeforeUnmount(() => {
    if (alertTimer) {
      clearTimeout(alertTimer)
      alertTimer = null
    }
  })

  watch(allowDiaryComments, (value) => {
    writeBooleanStorage(SETTINGS_STORAGE_KEYS.allowComment, value)
    showTimedAlert('success', '评论权限设置已保存')
  })

  watch(privacyDefaultVisibility, (value) => {
    writeStringStorage(SETTINGS_STORAGE_KEYS.privacyDefaultVisibility, value)
    showTimedAlert('success', '默认可见性已保存')
  })

  function showTimedAlert(type, text, duration = 2400) {
    privacyAlert.type = type
    privacyAlert.text = text
    privacyAlert.show = true

    if (alertTimer) {
      clearTimeout(alertTimer)
    }

    alertTimer = setTimeout(() => {
      privacyAlert.show = false
      alertTimer = null
    }, duration)
  }

  function openClearDialog() {
    clearDiaryDialog.value = true
  }

  function closeClearDialog() {
    if (clearingAllDiaries.value) {
      return
    }

    clearDiaryDialog.value = false
  }

  async function confirmClearAllDiaries() {
    if (clearingAllDiaries.value) {
      return
    }

    clearingAllDiaries.value = true

    try {
      const diaryIds = await collectAllDiaryIds()

      if (!diaryIds.length) {
        clearDiaryDialog.value = false
        showTimedAlert('info', '没有可清空的日记内容')
        return
      }

      let failCount = 0

      for (const diaryId of diaryIds) {
        try {
          await deleteDiary(diaryId)
        } catch (error) {
          console.error('[privacy settings clear diary delete error]', error)
          failCount += 1
        }
      }

      clearDiaryDialog.value = false

      if (failCount > 0) {
        showTimedAlert('warning', `已删除 ${diaryIds.length - failCount} 篇，${failCount} 篇删除失败`)
        return
      }

      showTimedAlert('success', `已清空 ${diaryIds.length} 篇日记`)
      SnackBar?.({
        text: '清空日记已完成',
        color: 'success',
        icon: 'mdi-delete-sweep-outline'
      })
    } catch (error) {
      console.error('[privacy settings clear diaries error]', error)
      showTimedAlert('error', error?.message || '清空失败，请稍后重试')
    } finally {
      clearingAllDiaries.value = false
    }
  }

  async function collectAllDiaryIds() {
    const result = new Set()
    const statuses = ['draft', 'active']

    for (const status of statuses) {
      let pn = 1
      const ps = 100

      while (true) {
        const data = await listDiaries({ pn, ps, status })
        const currentList = Array.isArray(data?.lists) ? data.lists : []

        currentList.forEach((item) => {
          const diaryId = item?.id
          if (diaryId !== undefined && diaryId !== null && diaryId !== '') {
            result.add(diaryId)
          }
        })

        if (!currentList.length || currentList.length < ps) {
          break
        }

        pn += 1
      }
    }

    return Array.from(result)
  }

  return {
    visibilityItems: SETTINGS_VISIBILITY_ITEMS,
    allowDiaryComments,
    privacyDefaultVisibility,
    clearDiaryDialog,
    clearingAllDiaries,
    privacyAlert,
    openClearDialog,
    closeClearDialog,
    confirmClearAllDiaries
  }
}
