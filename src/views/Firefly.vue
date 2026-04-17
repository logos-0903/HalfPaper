<template>
  <v-container fluid class="pa-0 d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-6 pa-md-7">
        <v-row align="center">
          <v-col cols="12" md="5" class="d-flex align-center ga-2">
            <v-icon color="warning">mdi-star-shooting</v-icon>
            <div class="text-h5 font-weight-bold">萤火集</div>
          </v-col>

          <v-col cols="12" md="7" class="d-flex justify-end">
            <v-btn color="primary" prepend-icon="mdi-pencil-outline" @click="goWrite">
              写日记
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" border>
      <v-card-text class="pa-6 pa-md-7">
        <v-row align="center" class="ga-2 ga-md-0">
          <v-col cols="12" md="8">
            <v-tabs
              :model-value="activeTab"
              color="primary"
              density="compact"
              @update:model-value="changeTab"
            >
              <v-tab
                v-for="item in tabItems"
                :key="item.value"
                :value="item.value"
              >
                {{ item.title }}
              </v-tab>
            </v-tabs>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              :model-value="diaryPageSize"
              :items="DIARY_PAGE_SIZE_OPTIONS"
              density="comfortable"
              hide-details
              label="每页最多展示"
              variant="outlined"
              @update:model-value="changePageSize"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row dense>
      <v-col cols="12" md="8" class="d-flex flex-column ga-4">
        <v-progress-linear v-if="loadingFeed" indeterminate color="primary" rounded />

        <v-list v-else-if="feedList.length" class="pa-0 bg-transparent d-flex flex-column ga-4">
          <v-list-item
            v-for="item in feedList"
            :key="item.id"
            class="pa-0"
          >
            <v-card rounded="xl" border class="w-100" @click="openDetail(item.id)">
              <v-card-item class="pa-6 pb-3">
                <template #prepend>
                  <v-avatar size="38" color="secondary" variant="tonal" class="mr-3">
                    <v-img v-if="item.authorAvatar" :src="item.authorAvatar" cover />
                    <v-sheet v-else color="transparent">{{ item.authorInitial }}</v-sheet>
                  </v-avatar>
                </template>

                <v-card-title class="px-0 pb-1 text-subtitle-2 font-weight-medium">
                  {{ item.authorName }}
                </v-card-title>
                <v-card-subtitle class="px-0">{{ feedTimeText(item) }}</v-card-subtitle>

                <template #append>
                  <v-btn icon variant="text" density="comfortable" @click.stop>
                    <v-icon>mdi-dots-horizontal</v-icon>
                  </v-btn>
                </template>
              </v-card-item>

              <v-card-text class="pt-0 px-6 pb-4 d-flex flex-column ga-3">
                <div class="text-h6 font-weight-medium">{{ item.title }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ item.preview }}</div>

                <v-sheet v-if="item.imageLayout.hasImages" color="transparent">
                  <v-img
                    v-if="item.imageLayout.single"
                    :src="item.imageLayout.items[0].url"
                    cover
                    height="220"
                    class="rounded-lg"
                  />

                  <v-row v-else dense>
                    <v-col
                      v-for="(image, index) in item.imageLayout.items"
                      :key="`${item.id}-${index}`"
                      :cols="item.imageLayout.cols"
                    >
                      <v-img
                        :src="image.url"
                        aspect-ratio="1"
                        cover
                        class="rounded-lg"
                      >
                        <template v-if="image.overlayText" #default>
                          <v-sheet color="black" class="fill-height d-flex align-center justify-center text-white text-h6 font-weight-bold">
                            {{ image.overlayText }}
                          </v-sheet>
                        </template>
                      </v-img>
                    </v-col>
                  </v-row>
                </v-sheet>

              </v-card-text>

              <v-card-actions class="px-6 pb-5 pt-0">
                <v-btn variant="text" @click.stop="handleToggleLike(item)">
                  <v-icon start size="18">{{ item.liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}</v-icon>
                  {{ item.likeCount }}
                </v-btn>

                <v-btn variant="text" @click.stop="openDetail(item.id)">
                  <v-icon start size="18">mdi-comment-outline</v-icon>
                  {{ item.commentCount }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-list-item>
        </v-list>

        <v-card v-else rounded="xl" border>
          <v-card-text class="pa-7 text-center text-medium-emphasis">暂无内容</v-card-text>
        </v-card>

        <div class="d-flex justify-center">
          <v-pagination
            v-if="feedTotal > diaryPageSize"
            v-model="page"
            :length="Math.ceil(feedTotal / diaryPageSize)"
            rounded="circle"
          />
        </div>
      </v-col>

      <v-col cols="12" md="4" class="d-flex flex-column ga-4">
        <v-card rounded="xl" border>
          <v-card-item class="pa-6 pb-3">
            <v-card-title class="px-0 d-flex align-center ga-2">
              <v-icon size="18">mdi-fire</v-icon>
              今日热门
            </v-card-title>
          </v-card-item>

          <v-progress-linear v-if="loadingHotList" indeterminate color="primary" rounded />

          <v-list v-else-if="hotList.length" class="pt-0">
            <v-list-item
              v-for="item in hotList"
              :key="`hot-${item.id}`"
              @click="openDetail(item.id)"
            >
              <template #prepend>
                <v-chip :color="rankColor(item.rank)" variant="tonal" size="small">#{{ item.rank }}</v-chip>
              </template>

              <v-list-item-title>{{ item.title }}</v-list-item-title>

              <template #append>
                <v-chip size="small" variant="text">
                  <v-icon start size="16">mdi-thumb-up-outline</v-icon>
                  {{ item.likeCount }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>

          <v-card-text v-else class="pa-7 text-center text-medium-emphasis">暂无热门内容</v-card-text>
        </v-card>

        <v-card rounded="xl" border>
          <v-card-item class="pa-6 pb-3">
            <v-card-title class="px-0 d-flex align-center ga-2">
              <v-icon size="18">mdi-information-outline</v-icon>
              关于萤火集
            </v-card-title>
          </v-card-item>

          <v-card-text class="px-6 pb-6 pt-0 text-body-2 text-medium-emphasis d-flex flex-column ga-1">
            <div>这里是匿名的夜晚。</div>
            <div>每一篇日记，都是一只萤火虫。</div>
            <div>微小，却真实地发过光。</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { DIARY_PAGE_SIZE_OPTIONS } from '@/constants/app'
import { usePreferencesStore } from '@/stores/preferences'
import { formatDate } from '@/utils/format'
import { useFirefly } from '@/composables/useFirefly'

const router = useRouter()
const preferencesStore = usePreferencesStore()
const { diaryPageSize } = storeToRefs(preferencesStore)
const page = ref(1)

const {
  tabItems,
  loadingFeed,
  loadingHotList,
  feedList,
  feedTotal,
  hotList,
  activeTab,
  fetchFeed,
  toggleLike,
  fetchHotList
} = useFirefly()

function feedTimeText(item) {
  return formatDate(item.createdAt)
}

function rankColor(rank) {
  if (rank === 1) {
    return 'error'
  }

  if (rank === 2) {
    return 'warning'
  }

  if (rank === 3) {
    return 'info'
  }

  return 'secondary'
}

function openDetail(diaryId) {
  router.push({
    name: 'Detail',
    params: { id: diaryId },
    query: { source: 'firefly' }
  })
}

function goWrite() {
  router.push({ name: 'diary-editor', query: { source: 'firefly' } })
}

function loadFeed() {
  return fetchFeed(activeTab.value, 'all', page.value, diaryPageSize.value)
}

function resetToFirstPageAndLoad() {
  if (page.value !== 1) {
    page.value = 1
    return
  }

  loadFeed()
}

function changeTab(value) {
  const nextTab = value || 'latest'
  activeTab.value = nextTab
  resetToFirstPageAndLoad()
}

function changePageSize(value) {
  const nextValue = Number(value)

  if (!Number.isFinite(nextValue) || nextValue <= 0) {
    return
  }

  preferencesStore.setDiaryPageSize(nextValue)
  resetToFirstPageAndLoad()
}

function handleToggleLike(item) {
  toggleLike(item.id)
}

async function refreshAll() {
  await Promise.all([
    loadFeed(),
    fetchHotList()
  ])
}

watch(page, (nextPage) => {
  fetchFeed(activeTab.value, 'all', nextPage, diaryPageSize.value)
})

onMounted(() => {
  refreshAll()
})
</script>
