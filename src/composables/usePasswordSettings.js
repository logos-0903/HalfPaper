import { computed, inject, onBeforeUnmount, reactive, ref } from 'vue'
import { sendEmailVerify, changePassword } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { hashPassword } from '@/utils/security'

export function useAccountSettings() {
  const SnackBar = inject('snack', null)
  const authStore = useAuthStore()

  const accountFormRef = ref(null)
  const sendingMailCode = ref(false)
  const newPassword = ref('')
  const confirmPassword = ref('')
  const mailCode = ref('')
  const captchaRef = ref(null)
  const submittingPassword = ref(false)
  const countdown = ref(0)
  const captchaToken = ref('')
  const accountAlert = reactive({
    show: false,
    type: 'info',
    text: ''
  })

  let alertTimer = null
  let countdownTimer = null

  const currentEmail = computed(() => String(authStore.profile?.email || '').trim())

  onBeforeUnmount(() => {
    if (alertTimer) {
      clearTimeout(alertTimer)
      alertTimer = null
    }

    clearCountdown()
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

  const mailCodeRules = {
    required: (value) => Boolean(String(value || '').trim()) || '请输入邮箱验证码',
    length: (value) => String(value || '').trim().length === 6 || '验证码为 6 位'
  }

  const canSendMailCode = computed(() => Boolean(currentEmail.value) && countdown.value === 0 && !sendingMailCode.value)

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

  function onCaptchaVerify(token) {
    captchaToken.value = String(token || '').trim()
  }

  function resetCaptcha() {
    captchaToken.value = ''
    captchaRef.value?.reset?.()
    window.hcaptcha?.reset?.()
  }

  function clearCountdown() {
    if (countdownTimer) {
      window.clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  function startCountdown() {
    clearCountdown()
    countdown.value = 60

    countdownTimer = window.setInterval(() => {
      countdown.value -= 1

      if (countdown.value <= 0) {
        countdown.value = 0
        clearCountdown()
      }
    }, 1000)
  }

  async function sendPasswordMailCode() {
    if (!canSendMailCode.value) {
      return
    }

    sendingMailCode.value = true
    SnackBar?.({
      text: '正在进行人机验证，请稍候…',
      color: 'info',
      icon: 'mdi-shield-check-outline'
    })

    try {
      await sendEmailVerify(currentEmail.value, 'change_password')
      startCountdown()
      showTimedAlert('success', '验证码已发送到当前邮箱')
      SnackBar?.({
        text: '密码修改验证码已发送',
        color: 'success',
        icon: 'mdi-email-check-outline'
      })
    } catch (error) {
      console.error('[account settings send password mail code error]', error)
      showTimedAlert('error', error?.message || '验证码发送失败，请稍后重试')
    } finally {
      sendingMailCode.value = false
    }
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

      if (!currentEmail.value) {
        showTimedAlert('error', '当前账号邮箱不存在，无法修改密码')
        return
      }

      if (!captchaToken.value) {
        showTimedAlert('error', '请先完成人机验证')
        return
      }

      const hashedPassword = await hashPassword(newPassword.value)

      await changePassword({
        new_password: hashedPassword,
        mail_code: mailCode.value.trim(),
        token: captchaToken.value
      })

      showTimedAlert('success', '密码修改成功')
      SnackBar?.({
        text: '密码已更新，其他设备会话已失效',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })

      mailCode.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      resetCaptcha()
    } catch (error) {
      console.error('[account settings submit password error]', error)
      showTimedAlert('error', error?.message || '密码修改失败，请稍后重试')
      resetCaptcha()
    } finally {
      submittingPassword.value = false
    }
  }

  return {
    accountFormRef,
    currentEmail,
    sendingMailCode,
    canSendMailCode,
    newPassword,
    confirmPassword,
    mailCode,
    mailCodeRules,
    captchaRef,
    countdown,
    onCaptchaVerify,
    resetCaptcha,
    submittingPassword,
    accountAlert,
    passwordRules,
    sendPasswordMailCode,
    submitPasswordChange
  }
}
