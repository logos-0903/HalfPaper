<template>
  <div class="d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-7">

        <v-row align="center" class="ga-3 ga-md-0">
          <v-col cols="12" md="3">
            <v-select
              v-model="diaryPageSize"
              :items="DIARY_PAGE_SIZE_OPTIONS"
              density="comfortable"
              hide-details
              label="每页数量"
              variant="outlined"
              @update:model-value="changePageSize"
            />
          </v-col>

          <v-col cols="12" md="5">
            <v-text-field
              v-model="keyword"
              clearable
              density="comfortable"
              hide-details
              label="筛选当前页标题或摘要"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" rounded />

    <v-row v-if="filteredFavorites.length" dense>
      <v-col v-for="item in filteredFavorites" :key="item.id" cols="12">
        <v-card rounded="xl" border class="favorite-card" @click="openDetail(item.id)">
          <v-card-item class="pa-7">
            <v-card-title class="font-weight-bold">{{ item.title || '无标题日记' }}</v-card-title>
            <v-card-subtitle>{{ diaryTimeText(item) }}</v-card-subtitle>
          </v-card-item>

          <v-card-text class="pt-0 px-7 pb-7">
            <div class="text-body-1">{{ summarizeText(item.summary, 180) }}</div>

            <div class="d-flex flex-wrap mt-4 text-body-2 text-medium-emphasis" style="gap: 20px;">
              <div class="d-flex align-center" style="gap: 6px;">
                <v-icon size="16">mdi-thumb-up-outline</v-icon>
                <span>{{ item.like_count ?? 0 }}</span>
              </div>
              <div class="d-flex align-center" style="gap: 6px;">
                <v-icon size="16">mdi-comment-outline</v-icon>
                <span>{{ item.comment_count ?? 0 }}</span>
              </div>
              <div class="d-flex align-center" style="gap: 6px;">
                <v-icon size="16">mdi-bookmark-outline</v-icon>
                <span>{{ item.favorite_count ?? 0 }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else-if="keyword && favoriteTotal > 0 && !loading" rounded="xl" border>
      <v-card-text class="pa-7 text-center">
        <div class="text-h6 font-weight-bold">这一页没有匹配内容</div>
        <div class="text-body-2 text-medium-emphasis mt-2">试试更短的关键词，或切换到其他分页查看。</div>
      </v-card-text>
    </v-card>

    <v-card v-else-if="!loading" rounded="xl" border>
      <v-card-text class="pa-7 text-center">
        <div class="text-h6 font-weight-bold">还没有收藏的日记</div>
        <div class="text-body-2 text-medium-emphasis mt-2">浏览萤火集，收藏你喜欢的日记吧。</div>
        <v-btn class="mt-5" color="primary" to="/firefly">去萤火集看看</v-btn>
      </v-card-text>
    </v-card>

    <div class="d-flex justify-center">
      <PaginationBar
        v-if="favoriteTotal > 0"
        v-model="page"
        :disabled="loading"
        :page-size="diaryPageSize"
        :total="favoriteTotal"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PaginationBar from '@/components/PaginationBar.vue'
import { useFavorite } from '@/composables/useFavorite'
import { DIARY_PAGE_SIZE_OPTIONS } from '@/constants/app'
import { usePreferencesStore } from '@/stores/preferences'
import { formatDate, getDiaryPrimaryTime, summarizeText } from '@/utils/format'

const router = useRouter()
const SnackBar = inject('snack', null)
const preferencesStore = usePreferencesStore()
const { diaryPageSize } = storeToRefs(preferencesStore)
const page = ref(1)
const keyword = ref('')
const {
  favorites,
  favoriteTotal,
  loadingFavorites: loading,
  loadFavorites
} = useFavorite()

const filteredFavorites = computed(() => {
  const query = String(keyword.value || '').trim().toLowerCase()

  if (!query) {
    return favorites.value
  }

  return favorites.value.filter((item) => {
    const title = String(item?.title || '').toLowerCase()
    const summary = String(item?.summary || '').toLowerCase()
    return title.includes(query) || summary.includes(query)
  })
})

watch(page, () => {
  loadCurrentPage().catch(showLoadError)
}, { immediate: true })

watch(diaryPageSize, () => {
  if (page.value !== 1) {
    page.value = 1
    return
  }

  loadCurrentPage().catch(showLoadError)
})

function diaryTimeText(item) {
  if (item?.favorite_created_at) {
    return `收藏于${formatDate(item.favorite_created_at)}`
  }

  const timeInfo = getDiaryPrimaryTime(item?.created_at, item?.updated_at)
  return `${timeInfo.label}${timeInfo.value}`
}

function openDetail(id) {
  router.push(`/diary/detail/${id}`)
}

function changePageSize(value) {
  const nextValue = Number(value)

  if (!Number.isFinite(nextValue) || nextValue <= 0) {
    return
  }

  preferencesStore.setDiaryPageSize(nextValue)
}

function loadCurrentPage() {
  return loadFavorites({
    pn: page.value,
    ps: diaryPageSize.value
  })
}

function showLoadError(error) {
  SnackBar?.({
    text: error.message || '获取收藏列表失败',
    color: 'error',
    icon: 'mdi-alert-circle-outline'
  })
}

</script>

<style scoped>
.favorite-card {
  cursor: pointer;
}
</style>
