<template>
    <div class="mx-auto" style="max-width: 460px">
        <div class="text-center mb-6">
            <div class="text-h4 font-weight-bold">登录半页纸</div>
            <div class="text-body-2 text-medium-emphasis mt-2">登录后继续使用</div>
        </div>

        <v-card rounded="xl" border>
            <v-card-text class="pa-7">
                <v-form @submit.prevent="submit">
                <v-text-field
                    v-model="form.email"
                    autocomplete="email"
                    clearable
                    label="邮箱"
                    prepend-inner-icon="mdi-email-outline"
                    variant="outlined"
                />

                <v-text-field
                    v-model="form.password"
                    :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    clearable
                    label="密码"
                    prepend-inner-icon="mdi-lock-outline"
                    variant="outlined"
                    @click:append-inner="showPassword = !showPassword"
                />

                <div class="my-4">
                    <div class="text-body-2 text-medium-emphasis mb-2">请完成人机验证</div>
                    <VueHcaptcha ref="captchaRef" :sitekey="HCAPTCHA_SITE_KEY" @verify="onCaptchaVerify" @expired="resetCaptcha" />
                </div>

                    <v-btn color="primary" :disabled="!canSubmit" :loading="loading" type="submit">登录</v-btn>
                </v-form>
            </v-card-text>
        </v-card>

        <div class="d-flex align-center justify-center mt-4">
            <span class="text-body-2 text-medium-emphasis">没有账号？</span>
            <v-btn variant="text" size="small" to="/register">去注册</v-btn>
        </div>
    </div>
</template>

<script setup>
import { computed, inject, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
import { HCAPTCHA_SITE_KEY } from '@/constants/app'
import { useAuthStore } from '@/stores/auth'
import { hashPassword } from '@/utils/security'

const route = useRoute()
const router = useRouter()
const SnackBar = inject('snack', null)
const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const captchaRef = ref(null)
const loading = ref(false)
const showPassword = ref(false)
const captchaToken = ref('')

const form = reactive({
    email: 'admin@123.com',
    password: 'admin123'
})

const canSubmit = computed(() => String(form.email || '').trim() && form.password && captchaToken.value)

function onCaptchaVerify(token) {
    captchaToken.value = token
}

function resetCaptcha() {
    captchaToken.value = ''
    captchaRef.value?.reset?.()
    window.hcaptcha?.reset?.()
}

async function submit() {
    if (!canSubmit.value || isLoggedIn.value) {
        return
    }

    loading.value = true

    try {
        const password = await hashPassword(form.password)

        await authStore.login({
            email: String(form.email || '').trim(),
            password,
            token: captchaToken.value
        })

        SnackBar?.({
            text: '登录成功',
            color: 'success',
            icon: 'mdi-check-circle-outline'
        })

        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
        router.replace(redirect)
    } catch (error) {
        SnackBar?.({
            text: error.message || '登录失败',
            color: 'error',
            icon: 'mdi-alert-circle-outline'
        })
        resetCaptcha()
    } finally {
        loading.value = false
    }
}
</script>