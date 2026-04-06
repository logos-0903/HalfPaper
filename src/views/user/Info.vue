<template>
  <div class="d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-6">
        <v-row align="center">
          <v-col cols="12" md="8">
            <div class="text-h5 font-weight-bold">个人中心</div>
            <div class="text-body-2 text-medium-emphasis mt-2">展示 /user/info 返回的账户资料，并在同一页维护本地主题与列表偏好。</div>
          </v-col>

          <v-col cols="12" md="4" class="d-flex justify-md-end">
            <v-btn color="primary" prepend-icon="mdi-refresh" :loading="refreshing" @click="refreshProfile">刷新资料</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" lg="4">
        <v-card rounded="xl" border>
          <v-card-text class="pa-6 text-center">
            <v-avatar size="92" color="primary" variant="tonal">
              <v-img v-if="profile?.avatar" :src="profile.avatar" cover />
              <span v-else class="text-h4">{{ (profile?.username || '半').slice(0, 1) }}</span>
            </v-avatar>

            <div class="text-h5 font-weight-bold mt-4">{{ profile?.username || '未命名用户' }}</div>
            <div class="text-body-2 text-medium-emphasis mt-2">{{ profile?.sign || '这个人还没有留下签名。' }}</div>

            <v-row dense class="mt-6">
              <v-col v-for="item in statsCards" :key="item.label" cols="6">
                <v-sheet border rounded="lg" class="pa-3">
                  <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                  <div class="text-h6 mt-1">{{ item.value }}</div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card rounded="xl" border>
          <v-card-title>账户资料</v-card-title>
          <v-card-text>
            <v-list density="comfortable" lines="two">
              <v-list-item v-for="item in profileRows" :key="item.label" :title="item.label" :subtitle="item.value" />
            </v-list>

            <v-alert class="mt-4" type="info" variant="tonal" rounded="xl">
              当前接口文档仅提供用户信息读取，没有资料更新接口，所以本页中的账户字段按只读方式展示。
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card rounded="xl" border class="mt-6">
          <v-card-title>本地偏好</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="themeName" :items="THEME_OPTIONS" label="主题模式" variant="outlined" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="diaryPageSize" :items="DIARY_PAGE_SIZE_OPTIONS" label="列表每页数量" variant="outlined" />
              </v-col>
            </v-row>

            <div class="text-subtitle-2 mt-2">最近搜索</div>
            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-chip v-for="item in searchHistory" :key="item" color="secondary" variant="tonal">{{ item }}</v-chip>
              <span v-if="!searchHistory.length" class="text-body-2 text-medium-emphasis">暂无搜索历史</span>
            </div>

            <div class="d-flex justify-end mt-4">
              <v-btn variant="text" @click="preferencesStore.clearSearchHistory()">清空搜索历史</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { DIARY_PAGE_SIZE_OPTIONS, THEME_OPTIONS } from '@/constants/app'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { formatDate, toDisplayText } from '@/utils/format'

const SnackBar = inject('snack', null)
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()

const { profile } = storeToRefs(authStore)
const { themeName, diaryPageSize, searchHistory } = storeToRefs(preferencesStore)

const refreshing = ref(false)

const statsCards = computed(() => [
  { label: '日记', value: profile.value?.diary_count ?? 0 },
  { label: '好友', value: profile.value?.friend_count ?? 0 },
  { label: '关注', value: profile.value?.follow_count ?? 0 },
  { label: '粉丝', value: profile.value?.fans_count ?? 0 }
])

const profileRows = computed(() => [
  { label: '邮箱', value: toDisplayText(profile.value?.email) },
  { label: '性别', value: toDisplayText(profile.value?.sex) },
  { label: '学校', value: toDisplayText(profile.value?.school) },
  { label: '个性签名', value: toDisplayText(profile.value?.sign) },
  { label: '用户 UUID', value: toDisplayText(profile.value?.uuid) },
  { label: '注册时间', value: formatDate(profile.value?.created_at) }
])

async function refreshProfile() {
  refreshing.value = true

  try {
    await authStore.fetchCurrentUser()
    SnackBar?.({
      text: '用户资料已刷新',
      color: 'success',
      icon: 'mdi-check-circle-outline'
    })
  } catch (error) {
    SnackBar?.({
      text: error.message || '刷新用户资料失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  } finally {
    refreshing.value = false
  }
}
</script>