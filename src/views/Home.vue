<template>
  <div class="d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-7">
        <v-row align="center">
          <v-col cols="12" md="8">
            <div class="text-overline">HalfPaper Journal</div>
            <div class="text-h4 font-weight-bold mt-1">在半页纸里，把今天写下来。</div>
            <div class="d-flex flex-wrap ga-3 mt-6">
              <v-btn color="primary" prepend-icon="mdi-pencil-outline" to="/write">开始写作</v-btn>
              <v-btn variant="tonal" prepend-icon="mdi-folder-edit-outline" to="/manage/list">打开信箱</v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="4">
            <v-row dense>
              <v-col v-for="item in statsCards" :key="item.label" cols="6">
                <v-sheet border rounded="xl" class="pa-4 h-100">
                  <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                  <div class="text-h5 font-weight-bold mt-2">{{ item.value }}</div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="activeKeyword"
      type="info"
      variant="tonal"
      rounded="xl"
      title="已应用首页搜索"
      :text="`当前关键字为「${activeKeyword}」，结果基于当前页数据做本地筛选。`"
    />

    <v-card v-if="!isLoggedIn" rounded="xl" border>
      <v-card-text class="pa-7">
        <div class="d-flex flex-wrap ga-3 mt-5">
          <v-btn color="primary" to="/login">去登录</v-btn>
          <v-btn variant="tonal" to="/register">去注册</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <template v-else>
      <v-card rounded="xl" border>
        <v-card-text class="pa-7">
          <v-row align="center">
            <v-col cols="12" md="4">
              <div class="text-h6 font-weight-bold">最近日记</div>
            </v-col>  

            <v-col cols="12" md="4">
              <v-select
                v-model="visibility"
                :items="visibilityOptions"
                density="comfortable"
                hide-details
                label="可见性"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="diaryPageSize"
                :items="DIARY_PAGE_SIZE_OPTIONS"
                density="comfortable"
                hide-details
                label="每页数量"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-progress-linear v-if="loading" indeterminate color="primary" rounded />

      <v-row v-if="filteredDiaries.length" dense>
        <v-col v-for="item in filteredDiaries" :key="item.id" cols="12">
          <v-card rounded="xl" border class="diary-card" @click="openDetail(item.id)">
            <v-card-item class="pa-7">
              <v-card-title class="font-weight-bold">{{ item.title || '无标题日记' }}</v-card-title>
              <v-card-subtitle>{{ diaryTimeText(item) }}</v-card-subtitle>

              <template #append>
                <div class="d-flex flex-wrap ga-2 justify-end">
                  <v-chip color="secondary" variant="tonal">{{ visibilityText(item.visibility) }}</v-chip>
                  <v-chip v-if="item.has_img" color="info" variant="tonal">含图片</v-chip>
                </div>
              </template>
            </v-card-item>

            <v-card-text class="pt-0 px-7 pb-7">
              <div class="text-body-1">{{ summarizeText(item.summary, 180) }}</div>

              <div class="d-flex flex-wrap ga-3 mt-4 text-body-2 text-medium-emphasis">
                <span>点赞 {{ item.like_count ?? 0 }}</span>
                <span>评论 {{ item.comment_count ?? 0 }}</span>
              </div>
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
              <v-btn variant="text" prepend-icon="mdi-pencil-outline" @click.stop="openEditor(item.id)">编辑</v-btn>
              <v-spacer />
              <v-btn
                v-if="item.user_id !== profile?.uuid"
                icon
                variant="text"
                size="small"
                @click.stop="handleToggleFavorite(item)"
              >
                <v-icon :color="item.is_favorited ? 'amber' : undefined">{{ item.is_favorited ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

     

      <div class="d-flex justify-center">
        <v-pagination
          v-if="total > diaryPageSize"
          v-model="page"
          :length="Math.ceil(total / diaryPageSize)"
          rounded="circle"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { DIARY_PAGE_SIZE_OPTIONS, VISIBILITY_OPTIONS } from '@/constants/app'
import { listDiaries } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useFavorite } from '@/composables/useFavorite'
import { getDiaryPrimaryTime, summarizeText } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const SnackBar = inject('snack', null)
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()

const { isLoggedIn, profile } = storeToRefs(authStore)
const { diaryPageSize } = storeToRefs(preferencesStore)
const { toggleFavorite } = useFavorite()

const loading = ref(false)
const diaries = ref([])
const total = ref(0)
const page = ref(1)
const visibility = ref('all')

const visibilityOptions = [{ title: '全部可见性', value: 'all' }, ...VISIBILITY_OPTIONS]

const activeKeyword = computed(() => typeof route.query.q === 'string' ? route.query.q.trim() : '')

const filteredDiaries = computed(() => {
  const keyword = activeKeyword.value.toLowerCase()

  if (!keyword) {
    return diaries.value
  }

  return diaries.value.filter((item) => {
    const text = `${item.title || ''} ${item.summary || ''}`.toLowerCase()
    return text.includes(keyword)
  })
})

const statsCards = computed(() => [
  { label: '我的日记', value: profile.value?.diary_count ?? 0 },
  { label: '获赞数量', value: profile.value?.liked_count ?? 0 }
])

watch([visibility, diaryPageSize], () => {
  page.value = 1
})

watch([isLoggedIn, visibility, page, diaryPageSize], ([loggedIn]) => {
  if (loggedIn) {
    loadDiaries()
    return
  }

  diaries.value = []
  total.value = 0
}, { immediate: true })

function visibilityText(value) {
  return visibilityOptions.find((item) => item.value === value)?.title || value || '未设置'
}

function diaryTimeText(item) {
  const timeInfo = getDiaryPrimaryTime(item?.created_at, item?.updated_at)
  return `${timeInfo.label}${timeInfo.value}`
}

function openDetail(itemId) {
  router.push(`/diary/detail/${itemId}`)
}

function openEditor(itemId) {
  router.push(`/write/${itemId}`)
}

function handleToggleFavorite(item) {
  toggleFavorite(item, {
    onError: (error) => {
      SnackBar?.({
        text: error.message || '收藏操作失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    }
  })
}

async function loadDiaries() {
  loading.value = true

  try {
    const data = await listDiaries({
      pn: page.value,
      ps: diaryPageSize.value,
      visibility: visibility.value,
      status: 'active'
    })

    diaries.value = data.lists || []
    total.value = data.total || 0
  } catch (error) {
    SnackBar?.({
      text: error.message || '获取日记列表失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.diary-card {
  cursor: pointer;
}
</style>
