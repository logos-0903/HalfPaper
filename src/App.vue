<template>
    <v-app>
        <v-app-bar color="surface" border="b" flat>
            <v-app-bar-nav-icon @click="drawer = !drawer" />
            <div>
                <div class="text-h6 font-weight-bold">{{ appName }}</div>
                <div class="text-caption text-medium-emphasis">把每天写成一页留白</div>
            </div>

            <v-spacer />

            <v-btn icon variant="text" @click="searchDialog = true">
                <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <v-btn icon variant="text" @click="preferencesStore.toggleTheme()">
                <v-icon>{{ themeIcon }}</v-icon>
            </v-btn>
            <v-btn icon variant="text" @click="router.push('/user/info')">
                <v-icon>mdi-cog-outline</v-icon>
            </v-btn>

            <v-menu location="bottom end" offset="12">
                <template #activator="{ props }">
                    <v-btn v-bind="props" class="ml-2" icon variant="text">
                        <v-avatar size="38" color="secondary" variant="tonal">
                            <v-img v-if="profile?.avatar" :src="profile.avatar" cover />
                            <span v-else class="text-subtitle-2 font-weight-bold">
                                {{ (profile?.username || '纸').slice(0, 1) }}
                            </span>
                        </v-avatar>
                    </v-btn>
                </template>

                <v-card width="320" rounded="xl">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar size="56" color="primary" variant="tonal">
                                <v-img v-if="profile?.avatar" :src="profile.avatar" cover />
                                <span v-else class="text-h6">{{ (profile?.username || '半').slice(0, 1) }}</span>
                            </v-avatar>
                        </template>

                        <v-card-title>{{ profile?.username || '访客' }}</v-card-title>
                        <v-card-subtitle>{{ profile?.email || '登录后同步你的日记与草稿' }}</v-card-subtitle>
                    </v-card-item>

                    <v-card-text>
                        <v-row dense>
                            <v-col cols="6">
                                <v-sheet border rounded="lg" class="pa-3">
                                    <div class="text-caption text-medium-emphasis">日记</div>
                                    <div class="text-h6">{{ profile?.diary_count ?? 0 }}</div>
                                </v-sheet>
                            </v-col>
                            <v-col cols="6">
                                <v-sheet border rounded="lg" class="pa-3">
                                    <div class="text-caption text-medium-emphasis">关注</div>
                                    <div class="text-h6">{{ profile?.follow_count ?? 0 }}</div>
                                </v-sheet>
                            </v-col>
                        </v-row>

                        <v-list class="px-0" density="comfortable" lines="one">
                            <v-list-item prepend-icon="mdi-account-circle-outline" title="个人中心" subtitle="查看账户与本地偏好" @click="router.push('/user/info')" />
                            <v-list-item prepend-icon="mdi-pencil-box-outline" title="继续写作" subtitle="进入写日记页面" @click="router.push('/write')" />
                        </v-list>
                    </v-card-text>

                    <v-card-actions class="px-4 pb-4 pt-0">
                        <v-btn v-if="!isLoggedIn" block color="primary" prepend-icon="mdi-login" to="/login">登录</v-btn>
                        <v-btn v-if="!isLoggedIn" block variant="tonal" prepend-icon="mdi-account-plus-outline" to="/register">注册</v-btn>
                        <v-btn v-if="isLoggedIn" block color="error" variant="tonal" prepend-icon="mdi-logout" @click="handleLogout">退出登录</v-btn>
                    </v-card-actions>
                </v-card>
            </v-menu>
        </v-app-bar>

        <v-navigation-drawer
            v-model="drawer"
            color="surface"
            :temporary="smAndDown"
            :permanent="!smAndDown"
            width="280"
        >
            <v-sheet color="primary" class="pa-5 text-white">
                <div class="text-overline">HalfPaper</div>
                <div class="text-h5 font-weight-bold">半页纸</div>
                <div class="text-body-2 mt-2 opacity-80">用一页的空间，记住值得留白的日常。</div>
            </v-sheet>

            <v-list class="pt-4" nav>
                <v-list-subheader>导航</v-list-subheader>
                <v-list-item
                    v-for="item in sideNavItems"
                    :key="item.to"
                    rounded="xl"
                    :prepend-icon="item.icon"
                    :title="item.title"
                    :subtitle="item.subtitle"
                    :to="item.to"
                />
            </v-list>

            <v-divider class="my-2" />

            <v-list nav>
                <v-list-subheader>会话</v-list-subheader>
                <v-list-item
                    :prepend-icon="isLoggedIn ? 'mdi-account-check-outline' : 'mdi-account-off-outline'"
                    :title="isLoggedIn ? '已登录' : '未登录'"
                    :subtitle="isLoggedIn ? (profile?.email || '账户信息已同步') : '登录后可读取日记数据'"
                />
                <v-list-item prepend-icon="mdi-theme-light-dark" title="主题切换" subtitle="浅色纸页 / 深色夜读" @click="preferencesStore.toggleTheme()" />
            </v-list>
        </v-navigation-drawer>

        <v-main>
            <v-container fluid class="pa-4 pa-md-6">
                <router-view />
            </v-container>
        </v-main>

        <v-bottom-navigation :model-value="bottomNavValue" color="primary" grow height="68">
            <v-btn v-for="item in bottomNavItems" :key="item.to" :to="item.to" :value="item.to">
                <v-icon>{{ item.icon }}</v-icon>
                <span>{{ item.title }}</span>
            </v-btn>
        </v-bottom-navigation>

        <v-dialog v-model="searchDialog" max-width="560">
            <v-card rounded="xl">
                <v-card-title class="pb-0">搜索日记</v-card-title>
                <v-card-text class="pt-4">
                    <v-text-field
                        v-model="searchText"
                        autofocus
                        clearable
                        label="输入标题或摘要关键字"
                        prepend-inner-icon="mdi-magnify"
                        @keyup.enter="submitSearch()"
                    />

                    <div class="text-subtitle-2 mb-2">最近搜索</div>
                    <div class="d-flex flex-wrap ga-2">
                        <v-chip
                            v-for="keyword in searchHistory"
                            :key="keyword"
                            color="secondary"
                            variant="tonal"
                            @click="submitSearch(keyword)"
                        >
                            {{ keyword }}
                        </v-chip>
                        <span v-if="!searchHistory.length" class="text-body-2 text-medium-emphasis">暂无搜索记录</span>
                    </div>
                </v-card-text>
                <v-card-actions class="px-6 pb-5">
                    <v-btn variant="text" @click="preferencesStore.clearSearchHistory()">清空记录</v-btn>
                    <v-spacer />
                    <v-btn variant="text" @click="searchDialog = false">取消</v-btn>
                    <v-btn color="primary" @click="submitSearch()">搜索</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snack.show" :color="snack.color" location="top" rounded="pill" timeout="2600">
            <div class="d-flex align-center ga-3">
                <v-icon v-if="snack.icon">{{ snack.icon }}</v-icon>
                <span>{{ snack.text }}</span>
            </div>
        </v-snackbar>
    </v-app>
</template>

<script setup>
import { computed, onMounted, provide, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { APP_NAME } from '@/constants/app'
import { useSnack } from '@/composables/useSnack'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'

const route = useRoute()
const router = useRouter()
const theme = useTheme()
const { smAndDown } = useDisplay()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { snack, SnackBar } = useSnack()

provide('snack', SnackBar)

const { profile, isLoggedIn } = storeToRefs(authStore)
const { searchHistory, themeName } = storeToRefs(preferencesStore)

const appName = APP_NAME
const drawer = ref(!smAndDown.value)
const searchDialog = ref(false)
const searchText = ref(typeof route.query.q === 'string' ? route.query.q : '')

const sideNavItems = [
    { title: '首页', subtitle: '查看最近发布的日记', icon: 'mdi-notebook-outline', to: '/' },
    { title: '写日记', subtitle: '新建草稿或直接发布', icon: 'mdi-pencil-box-outline', to: '/write' },
    { title: '内容管理', subtitle: '草稿箱与已发布内容', icon: 'mdi-folder-edit-outline', to: '/manage/list' },
    { title: '个人中心', subtitle: '账户信息与本地偏好', icon: 'mdi-account-cog-outline', to: '/user/info' }
]

const bottomNavItems = [
    { title: '首页', icon: 'mdi-home-variant-outline', to: '/' },
    { title: '写作', icon: 'mdi-pencil-outline', to: '/write' },
    { title: '管理', icon: 'mdi-folder-outline', to: '/manage/list' },
    { title: '我的', icon: 'mdi-account-outline', to: '/user/info' }
]

const themeIcon = computed(() => themeName.value === 'halfpaperDark' ? 'mdi-weather-sunny' : 'mdi-weather-night')

const bottomNavValue = computed(() => {
    if (route.path.startsWith('/write')) return '/write'
    if (route.path.startsWith('/manage/list')) return '/manage/list'
    if (route.path.startsWith('/user/info')) return '/user/info'
    return '/'
})

watch(themeName, (value) => {
    theme.global.name.value = value
}, { immediate: true })

watch(smAndDown, (value) => {
    drawer.value = !value
}, { immediate: true })

watch(() => route.query.q, (value) => {
    searchText.value = typeof value === 'string' ? value : ''
})

onMounted(async () => {
    try {
        await authStore.initialize()
    } catch (error) {
        if (!route.meta.requiresAuth) {
            SnackBar({
                text: error.message || '暂时无法同步登录状态',
                color: 'warning',
                icon: 'mdi-alert-circle-outline'
            })
        }
    }
})

function submitSearch(keyword = searchText.value) {
    const value = keyword.trim()

    if (value) {
        preferencesStore.addSearchKeyword(value)
    }

    router.push({
        path: '/',
        query: value ? { q: value } : {}
    })

    searchDialog.value = false
}

function handleLogout() {
    authStore.logout()
    SnackBar({
        text: '已清除当前登录状态',
        color: 'info',
        icon: 'mdi-logout'
    })

    if (route.meta.requiresAuth) {
        router.replace('/login')
    }
}
</script>
