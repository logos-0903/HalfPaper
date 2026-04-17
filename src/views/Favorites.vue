<template>
  <div class="d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-7">
        <div class="d-flex align-center ga-3">
          <v-btn variant="text" prepend-icon="mdi-arrow-left" class="px-0" @click="router.back()">返回</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" rounded />

    <v-row v-if="favorites.length" dense>
      <v-col v-for="item in favorites" :key="item.id" cols="12">
        <v-card rounded="xl" border class="favorite-card" @click="openDetail(item.id)">
          <v-card-item class="pa-7">
            <v-card-title class="font-weight-bold">{{ item.title || '无标题日记' }}</v-card-title>
            <v-card-subtitle>{{ diaryTimeText(item) }}</v-card-subtitle>

            <template #append>
              <v-btn
                icon
                variant="text"
                size="small"
                @click.stop="handleToggleFavorite(item)"
              >
                <v-icon :color="item.is_favorited ? 'amber' : undefined">{{ item.is_favorited ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
              </v-btn>
            </template>
          </v-card-item>

          <v-card-text class="pt-0 px-7 pb-7">
            <div class="text-body-1">{{ summarizeText(item.summary, 180) }}</div>

            <div class="d-flex flex-wrap ga-3 mt-4 text-body-2 text-medium-emphasis">
              <span>点赞 {{ item.like_count ?? 0 }}</span>
              <span>评论 {{ item.comment_count ?? 0 }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else-if="!loading" rounded="xl" border>
      <v-card-text class="pa-7 text-center">
        <div class="text-h6 font-weight-bold">还没有收藏的日记</div>
        <div class="text-body-2 text-medium-emphasis mt-2">浏览萤火集，收藏你喜欢的日记吧。</div>
        <v-btn class="mt-5" color="primary" to="/firefly">去萤火集看看</v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listFavorites } from '@/services/api'
import { useFavorite } from '@/composables/useFavorite'
import { getDiaryPrimaryTime, summarizeText } from '@/utils/format'

const router = useRouter()
const SnackBar = inject('snack', null)
const { toggleFavorite } = useFavorite()

const loading = ref(false)
const favorites = ref([])

onMounted(() => {
  loadFavorites()
})

function diaryTimeText(item) {
  const timeInfo = getDiaryPrimaryTime(item?.created_at, item?.updated_at)
  return `${timeInfo.label}${timeInfo.value}`
}

function openDetail(id) {
  router.push(`/diary/detail/${id}`)
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

async function loadFavorites() {
  loading.value = true

  try {
    const data = await listFavorites({ ps: 50 })
    favorites.value = (data.lists || []).map((item) => ({
      ...item,
      is_favorited: true
    }))
  } catch (error) {
    SnackBar?.({
      text: error.message || '获取收藏列表失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.favorite-card {
  cursor: pointer;
}
</style>
