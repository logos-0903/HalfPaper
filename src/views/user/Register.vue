<template>
    <div class="mx-auto" style="max-width: 500px">
        <div class="text-center mb-6">
            <div class="text-h4 font-weight-bold">创建账号</div>
            <div class="text-body-2 text-medium-emphasis mt-2">填写以下信息完成注册</div>
        </div>

        <v-card rounded="xl" border>
            <v-card-text class="pa-7">
                <v-form @submit.prevent="submitRegister">
                <v-text-field v-model="form.username" clearable label="用户名" placeholder="请输入用户名" persistent-placeholder prepend-inner-icon="mdi-account-outline" variant="outlined" />
                <v-text-field v-model="form.email" clearable label="邮箱" placeholder="请输入邮箱" persistent-placeholder prepend-inner-icon="mdi-email-outline" variant="outlined" />

                <v-text-field
                    v-model="form.password"
                    :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    :type="showPassword ? 'text' : 'password'"
                    clearable
                    label="密码"
                    placeholder="请输入密码"
                    persistent-placeholder
                    prepend-inner-icon="mdi-lock-outline"
                    variant="outlined"
                    @click:append-inner="showPassword = !showPassword"
                />

                <v-text-field
                    v-model="form.confirmPassword"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    clearable
                    label="确认密码"
                    placeholder="请再次输入密码"
                    persistent-placeholder
                    prepend-inner-icon="mdi-lock-check-outline"
                    variant="outlined"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                />

                <v-row dense align="center" class="mb-2">
                    <v-col cols="7">
                        <v-text-field
                            v-model="form.mail_code"
                            clearable
                            hide-details
                            label="邮箱验证码"
                            placeholder="请输入验证码"
                            persistent-placeholder
                            prepend-inner-icon="mdi-shield-key-outline"
                            variant="outlined"
                        />
                    </v-col>
                    <v-col cols="5">
                        <v-btn block :disabled="!canSendCode" :loading="sendingCode" variant="tonal" @click="sendCode">
                            {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                        </v-btn>
                    </v-col>
                </v-row>

                <div class="my-4">
                    <div class="text-body-2 text-medium-emphasis mb-2">请完成人机验证</div>
                    <VueHcaptcha ref="captchaRef" :sitekey="HCAPTCHA_SITE_KEY" @verify="onCaptchaVerify" @expired="resetCaptcha" />
                </div>

                <v-btn color="primary" :disabled="!canRegister" :loading="registering" type="submit">注册</v-btn>
                </v-form>
            </v-card-text>
        </v-card>

        <div class="d-flex align-center justify-center mt-4">
            <span class="text-body-2 text-medium-emphasis">已有账号？</span>
            <v-btn variant="text" size="small" to="/login">去登录</v-btn>
        </div>
    </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
import { HCAPTCHA_SITE_KEY } from '@/constants/app'
import { sendEmailVerify } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { hashPassword } from '@/utils/security'

const router = useRouter()
const SnackBar = inject('snack', null)
const authStore = useAuthStore()

const captchaRef = ref(null)
const sendingCode = ref(false)
const registering = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const countdown = ref(0)
const captchaToken = ref('')

const form = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    mail_code: ''
})

let countdownTimer = null

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || '').trim()))
const usernameValid = computed(() => {
    const len = String(form.username || '').trim().length
    return len >= 5 && len <= 16
})
const passwordValid = computed(() => String(form.password || '').length >= 6)
const passwordConfirmed = computed(() => form.password && form.password === form.confirmPassword)

const canSendCode = computed(() => emailValid.value && countdown.value === 0 && !sendingCode.value)
const canRegister = computed(() => {
    return usernameValid.value && emailValid.value && passwordValid.value && passwordConfirmed.value && String(form.mail_code || '').trim() && captchaToken.value
})

onBeforeUnmount(() => {
    clearCountdown()
})

function onCaptchaVerify(token) {
    captchaToken.value = token
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
            clearCountdown()
        }
    }, 1000)
}

async function sendCode() {
    if (!canSendCode.value) {
        return
    }

    sendingCode.value = true
    SnackBar?.({
        text: '正在进行人机验证，请稍候…',
        color: 'info',
        icon: 'mdi-shield-check-outline'
    })

    try {
        await sendEmailVerify(String(form.email || '').trim())
        startCountdown()
        SnackBar?.({
            text: '邮箱验证码已发送，请注意查收',
            color: 'success',
            icon: 'mdi-email-check-outline'
        })
    } catch (error) {
        SnackBar?.({
            text: error.message || '发送邮箱验证码失败',
            color: 'error',
            icon: 'mdi-alert-circle-outline'
        })
    } finally {
        sendingCode.value = false
    }
}

async function submitRegister() {
    if (!canRegister.value) {
        return
    }

    registering.value = true

    try {
        const password = await hashPassword(form.password)

        await authStore.register({
            username: String(form.username || '').trim(),
            email: String(form.email || '').trim(),
            password,
            token: captchaToken.value,
            mail_code: String(form.mail_code || '').trim()
        })

        SnackBar?.({
            text: '注册成功，请登录',
            color: 'success',
            icon: 'mdi-check-circle-outline'
        })
        router.replace('/login')
    } catch (error) {
        SnackBar?.({
            text: error.message || '注册失败',
            color: 'error',
            icon: 'mdi-alert-circle-outline'
        })
        resetCaptcha()
    } finally {
        registering.value = false
    }
}
</script>