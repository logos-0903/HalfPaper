import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  SETTINGS_STORAGE_KEYS,
  readBooleanStorage,
  writeBooleanStorage
} from '@/composables/settingsShared'

export function useEditorSettings() {
  const syncPrivacyToEditor = ref(readBooleanStorage(SETTINGS_STORAGE_KEYS.syncEditorVisibility, true))
  const editorAlert = reactive({
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

  watch(syncPrivacyToEditor, (value) => {
    writeBooleanStorage(SETTINGS_STORAGE_KEYS.syncEditorVisibility, value)
    showTimedAlert('success', value ? '已开启同步隐私默认可见性' : '已关闭同步隐私默认可见性')
  })

  function showTimedAlert(type, text, duration = 2400) {
    editorAlert.type = type
    editorAlert.text = text
    editorAlert.show = true

    if (alertTimer) {
      clearTimeout(alertTimer)
    }

    alertTimer = setTimeout(() => {
      editorAlert.show = false
      alertTimer = null
    }, duration)
  }

  return {
    syncPrivacyToEditor,
    editorAlert
  }
}
