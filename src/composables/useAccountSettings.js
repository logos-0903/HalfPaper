import { inject, onBeforeUnmount, reactive, ref } from 'vue'

export function useAccountSettings() {
  const SnackBar = inject('snack', null)

  const accountFormRef = ref(null)
  const newPassword = ref('')
  const confirmPassword = ref('')
  const submittingPassword = ref(false)
  const accountAlert = reactive({
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

  const passwordRules = {
    required: (value) => Boolean(String(value || '').trim()) || '请输入密码',
    length: (value) => {
      const length = String(value || '').trim().length
      return (length >= 8 && length <= 32) || '密码长度需在 8-32 位之间'
    },
    sameAsConfirm: (value) => String(value || '') === String(confirmPassword.value || '') || '两次输入密码不一致',
    sameAsPassword: (value) => String(value || '') === String(newPassword.value || '') || '两次输入密码不一致'
  }

  function showTimedAlert(type, text, duration = 2400) {
    accountAlert.type = type
    accountAlert.text = text
    accountAlert.show = true

    if (alertTimer) {
      clearTimeout(alertTimer)
    }

    alertTimer = setTimeout(() => {
      accountAlert.show = false
      alertTimer = null
    }, duration)
  }

  async function submitPasswordChange() {
    if (submittingPassword.value) {
      return
    }

    submittingPassword.value = true

    try {
      const result = await accountFormRef.value?.validate()
      if (result && result.valid === false) {
        showTimedAlert('error', '请先修正密码输入错误')
        return
      }

      showTimedAlert('success', '密码校验通过，已提交修改请求')
      SnackBar?.({
        text: '密码修改请求已提交',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })

      newPassword.value = ''
      confirmPassword.value = ''
    } catch (error) {
      console.error('[account settings submit password error]', error)
      showTimedAlert('error', '密码修改失败，请稍后重试')
    } finally {
      submittingPassword.value = false
    }
  }

  return {
    accountFormRef,
    newPassword,
    confirmPassword,
    submittingPassword,
    accountAlert,
    passwordRules,
    submitPasswordChange
  }
}
