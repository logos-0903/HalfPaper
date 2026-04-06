<template>
    <v-row>
        <v-col cols="12" md="7">
            <v-card rounded="xl" border class="h-100">
                <v-card-text class="pa-6 pa-md-8 d-flex flex-column justify-space-between h-100">
                    <div>
                        <div class="text-overline">Create Account</div>
                        <div class="text-h4 font-weight-bold mt-2">注册一个属于你的半页纸。</div>
                        <div class="text-body-1 text-medium-emphasis mt-4">
                            注册流程基于接口文档中的邮箱验证码和 hCaptcha。发送邮箱验证码走 /auth/emailvarify，提交注册走 /auth/register。
                        </div>
                    </div>

                    <v-row dense class="mt-8">
                        <v-col cols="12" sm="4">
                            <v-sheet border rounded="xl" class="pa-4">
                                <div class="text-caption text-medium-emphasis">用户名</div>
                                <div class="text-h6 mt-2">5 到 16 位</div>
                            </v-sheet>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-sheet border rounded="xl" class="pa-4">
                                <div class="text-caption text-medium-emphasis">密码提交</div>
                                <div class="text-h6 mt-2">前端哈希后上传</div>
                            </v-sheet>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-sheet border rounded="xl" class="pa-4">
                                <div class="text-caption text-medium-emphasis">邮箱校验</div>
                                <div class="text-h6 mt-2">验证码 60 秒冷却</div>
                            </v-sheet>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" md="5">
            <v-card rounded="xl" border>
                <v-card-text class="pa-6">
                    <div class="text-h5 font-weight-bold">创建账号</div>
                    <div class="text-body-2 text-medium-emphasis mt-2">填完信息后，通过验证码和 hCaptcha 完成注册。</div>

                    <v-form class="mt-6" @submit.prevent="submitRegister">
                        <v-text-field v-model="form.username" clearable label="用户名" prepend-inner-icon="mdi-account-outline" variant="outlined" />
                        <v-text-field v-model="form.email" clearable label="邮箱" prepend-inner-icon="mdi-email-outline" variant="outlined" />

                        <v-row>
                            <v-col cols="12" sm="7">
                                <v-text-field
                                    v-model="form.mail_code"
                                    clearable
                                    label="邮箱验证码"
                                    prepend-inner-icon="mdi-shield-key-outline"
                                    variant="outlined"
                                />
                            </v-col>

                            <v-col cols="12" sm="5">
                                <v-btn block class="h-100" :disabled="!canSendCode" :loading="sendingCode" variant="tonal" @click="sendCode">
                                    {{ countdown > 0 ? `${countdown}s 后重试` : '发送验证码' }}
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-text-field
                            v-model="form.password"
                            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                            :type="showPassword ? 'text' : 'password'"
                            clearable
                            label="密码"
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
                            prepend-inner-icon="mdi-lock-check-outline"
                            variant="outlined"
                            @click:append-inner="showConfirmPassword = !showConfirmPassword"
                        />

                        <div class="my-4 d-flex justify-center">
                            <VueHcaptcha ref="captchaRef" :sitekey="HCAPTCHA_SITE_KEY" @verify="onCaptchaVerify" @expired="resetCaptcha" />
                        </div>

                        <v-alert type="info" variant="tonal" rounded="xl" class="mb-4">
                            当前 API 文档没有提供自动登录接口返回说明，因此注册成功后会跳转到登录页。
                        </v-alert>

                        <div class="d-flex align-center justify-space-between mt-4">
                            <v-btn variant="text" to="/login">已有账号，去登录</v-btn>
                            <v-btn color="primary" :disabled="!canRegister" :loading="registering" type="submit">注册</v-btn>
                        </div>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
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

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
const usernameValid = computed(() => form.username.trim().length >= 5 && form.username.trim().length <= 16)
const passwordValid = computed(() => form.password.length >= 6)
const passwordConfirmed = computed(() => form.password && form.password === form.confirmPassword)

const canSendCode = computed(() => emailValid.value && countdown.value === 0 && !sendingCode.value)
const canRegister = computed(() => {
    return usernameValid.value && emailValid.value && passwordValid.value && passwordConfirmed.value && form.mail_code.trim() && captchaToken.value
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

    try {
        await sendEmailVerify(form.email.trim())
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
            username: form.username.trim(),
            email: form.email.trim(),
            password,
            token: captchaToken.value,
            mail_code: form.mail_code.trim()
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