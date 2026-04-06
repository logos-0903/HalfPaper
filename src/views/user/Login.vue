<template>
    <v-row>
        <v-col cols="12" md="7">
            <v-card rounded="xl" border class="h-100">
                <v-card-text class="pa-6 pa-md-8 d-flex flex-column justify-space-between h-100">
                    <div>
                        <div class="text-overline">HalfPaper Access</div>
                        <div class="text-h4 font-weight-bold mt-2">登录后继续你的写作流。</div>
                        <div class="text-body-1 text-medium-emphasis mt-4">
                            登录接口会使用邮箱、经过前端哈希的密码和 hCaptcha token。成功后服务端通过 Cookie 维护会话，前端再同步用户信息和页面状态。
                        </div>
                    </div>

                    <v-row dense class="mt-8">
                        <v-col cols="12" sm="6">
                            <v-sheet border rounded="xl" class="pa-4">
                                <div class="text-caption text-medium-emphasis">登录字段</div>
                                <div class="text-h6 mt-2">邮箱 + 密码 + hCaptcha</div>
                            </v-sheet>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-sheet border rounded="xl" class="pa-4">
                                <div class="text-caption text-medium-emphasis">会话方式</div>
                                <div class="text-h6 mt-2">SESSTOKEN Cookie</div>
                            </v-sheet>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" md="5">
            <v-card rounded="xl" border>
                <v-card-text class="pa-6">
                    <div class="text-h5 font-weight-bold">登录半页纸</div>
                    <div class="text-body-2 text-medium-emphasis mt-2">使用接口文档中的 /auth/login 进入日记站。</div>

                    <v-form class="mt-6" @submit.prevent="submit">
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

                        <div class="my-4 d-flex justify-center">
                            <VueHcaptcha ref="captchaRef" :sitekey="HCAPTCHA_SITE_KEY" @verify="onCaptchaVerify" @expired="resetCaptcha" />
                        </div>

                        <div class="d-flex align-center justify-space-between mt-4">
                            <v-btn variant="text" to="/register">没有账号，去注册</v-btn>
                            <v-btn color="primary" :disabled="!canSubmit" :loading="loading" type="submit">登录</v-btn>
                        </div>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
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
    email: '',
    password: ''
})

const canSubmit = computed(() => form.email.trim() && form.password && captchaToken.value)

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
            email: form.email.trim(),
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