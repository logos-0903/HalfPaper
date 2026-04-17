<template>
    <v-app>
        <v-app-bar color="surface" border="b" flat>
            <v-app-bar-nav-icon @click="drawer = !drawer" />
            <div>
                <div class="text-h6 font-weight-bold">{{ appName }}</div>
            </div>

            <v-spacer />

            <template v-if="isLoggedIn">
                <v-btn icon variant="text" @click="searchDialog = true">
                    <v-icon>mdi-magnify</v-icon>
                </v-btn>
                <v-btn icon variant="text" @click="preferencesStore.toggleTheme()">
                    <v-icon>{{ themeIcon }}</v-icon>
                </v-btn>
                <v-btn icon variant="text" @click="router.push('/firefly')">
                    <v-icon>mdi-star-shooting</v-icon>
                </v-btn>
                <v-btn icon variant="text" @click="router.push('/settings')">
                    <v-icon>mdi-cog-outline</v-icon>
                </v-btn>
            </template>

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

                <v-card width="280" rounded="xl">
                    <v-card-item class="pa-5 pb-3">
                        <template #prepend>
                            <v-avatar size="48" color="primary" variant="tonal">
                                <v-img v-if="profile?.avatar" :src="profile.avatar" cover />
                                <span v-else class="text-subtitle-1 font-weight-bold">{{ (profile?.username || '半').slice(0, 1) }}</span>
                            </v-avatar>
                        </template>

                        <v-card-title class="text-subtitle-1 font-weight-medium">{{ profile?.username || '访客' }}</v-card-title>
                        <v-card-subtitle class="text-caption">{{ profile?.email || '登录后同步你的日记与草稿' }}</v-card-subtitle>
                    </v-card-item>

                    <v-divider />

                    <v-list v-if="isLoggedIn" density="compact" nav class="py-2">
                        <v-list-item rounded="lg" prepend-icon="mdi-account-circle-outline" title="个人中心" @click="router.push('/user/info')" />
                        <v-list-item rounded="lg" prepend-icon="mdi-pencil-box-outline" title="继续写作" @click="router.push('/write')" />
                    </v-list>

                    <v-divider v-if="isLoggedIn" />

                    <div v-if="!isLoggedIn" class="d-flex ga-2 pa-3">
                        <v-btn color="primary" variant="flat" size="small" to="/login">登录</v-btn>
                        <v-btn variant="outlined" size="small" to="/register">注册</v-btn>
                    </div>
                    <div v-else class="pa-3">
                        <v-btn block color="error" variant="text" size="small" prepend-icon="mdi-logout" @click="handleLogout">退出登录</v-btn>
                    </div>
                </v-card>
            </v-menu>
        </v-app-bar>

        <v-navigation-drawer
            v-model="drawer"
            color="surface"
            :temporary="smAndDown || isFireflyPage"
            :permanent="!smAndDown && !isFireflyPage"
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

            <v-list density="compact" nav class="pb-0">
                <v-list-group value="about">
                    <template #activator="{ props }">
                        <v-list-item v-bind="props" prepend-icon="mdi-information-outline" title="关于" />
                    </template>
                    <v-list-item title="关于半页纸" to="/about" density="compact" />
                    <v-list-item title="用户协议" to="/about/terms" density="compact" />
                    <v-list-item title="隐私政策" to="/about/privacy" density="compact" />
                    <v-list-item title="联系我们" href="mailto:support@halfpaper.com" density="compact" />
                </v-list-group>
            </v-list>

            <v-spacer />

            <div class="pa-4 text-caption text-medium-emphasis opacity-60 text-center">
                &copy; {{ new Date().getFullYear() }} HalfPaper
            </div>
        </v-navigation-drawer>

        <v-main class="app-main">
            <div class="hp-shell">
                <v-container class="hp-content hp-content--sm pa-4 pa-md-6 pa-lg-8">
                    <router-view />
                </v-container>
            </div>
        </v-main>

        <v-dialog v-model="searchDialog" max-width="560">
            <v-card rounded="xl">
                <v-card-title class="pb-0">搜索日记</v-card-title>
                <v-card-text class="pa-7">
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

const isFireflyPage = computed(() => route.path === '/firefly')

const sideNavItems = computed(() => {
    const base = [
        { title: '首页', icon: 'mdi-notebook-outline', to: '/' },
    ]
    if (isLoggedIn.value) {
        base.push(
            { title: '写日记', icon: 'mdi-pencil-box-outline', to: '/write' },
            { title: '内容管理', icon: 'mdi-folder-edit-outline', to: '/manage/list' },
            { title: '个人中心', icon: 'mdi-account-cog-outline', to: '/user/info' },
            { title: '设置', icon: 'mdi-cog-outline', to: '/settings' },
            { title: '我的收藏', icon: 'mdi-star', to: '/favorites' },
        )
    }
    return base
})

const themeIcon = computed(() => themeName.value === 'halfpaperDark' ? 'mdi-weather-sunny' : 'mdi-weather-night')

watch(themeName, (value) => {
    theme.global.name.value = value
}, { immediate: true })

watch(smAndDown, (value) => {
    drawer.value = !value
}, { immediate: true })

watch(() => route.query.q, (value) => {
    searchText.value = typeof value === 'string' ? value : ''
})

watch(() => route.fullPath, () => {
    // On mobile, collapse the temporary drawer after navigation.
    if (smAndDown.value) {
        drawer.value = false
    }
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

async function handleLogout() {
    await authStore.logout()
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

<style scoped>
.app-main {
    background: rgb(var(--v-theme-background));
}

.app-main--fullscreen {
    padding-left: 0 !important;
}

.hp-shell--fullscreen {
    max-width: 1200px;
    margin: 0 auto;
}

.hp-content--firefly {
    max-width: none;
    padding: 0;
}

</style>
