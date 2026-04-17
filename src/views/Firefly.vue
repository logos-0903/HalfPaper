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
        <v-row align="center">
          <v-col cols="12" md="4">
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
            <v-text-field
              v-model="keyword"
              clearable
              hide-details
              density="comfortable"
              placeholder="搜索关键词或话题"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @click:clear="handleClearSearch"
              @keydown.enter="applyFilters"
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

                <template v-if="isAdmin" #append>
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-btn icon variant="text" density="comfortable" v-bind="props" @click.stop>
                        <v-icon>mdi-dots-horizontal</v-icon>
                      </v-btn>
                    </template>

                    <v-list density="compact" @click.stop>
                      <v-list-item prepend-icon="mdi-eye-off-outline" title="隐藏"
                        @click="openHideDialog(item)" />
                    </v-list>
                  </v-menu>
                </template>
              </v-card-item>

              <v-card-text class="pt-0 px-6 pb-4 d-flex flex-column ga-3">
                <div class="text-h6 font-weight-medium">{{ item.title }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ item.preview }}</div>

                <div class="d-flex flex-wrap ga-2">
                  <v-chip v-if="item.topicName" size="small" color="secondary" variant="tonal">
                    {{ item.topicName }}
                  </v-chip>
                  <v-chip v-if="item.weather" size="small" variant="tonal">天气 {{ item.weather }}</v-chip>
                  <v-chip v-if="item.mood" size="small" variant="tonal">心情 {{ item.mood }}</v-chip>
                </div>

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
                <div class="d-flex flex-wrap text-body-2 text-medium-emphasis" style="gap: 20px;">
                  <div class="d-flex align-center" style="gap: 6px;">
                    <v-icon size="16">mdi-thumb-up-outline</v-icon>
                    <span>{{ item.likeCount }}</span>
                  </div>
                  <div class="d-flex align-center" style="gap: 6px;">
                    <v-icon size="16">mdi-comment-outline</v-icon>
                    <span>{{ item.commentCount }}</span>
                  </div>
                  <div class="d-flex align-center" style="gap: 6px;">
                    <v-icon size="16">mdi-bookmark-outline</v-icon>
                    <span>{{ item.favoriteCount }}</span>
                  </div>
                </div>
              </v-card-actions>
            </v-card>
          </v-list-item>
        </v-list>

        <v-card v-else rounded="xl" border>
          <v-card-text class="pa-7 text-center text-medium-emphasis">暂无内容</v-card-text>
        </v-card>

        <div class="d-flex justify-center">
          <PaginationBar
            v-if="feedTotal > 0"
            v-model="page"
            :disabled="loadingFeed"
            :page-size="diaryPageSize"
            :total="feedTotal"
          />
        </div>
      </v-col>

      <v-col cols="12" md="4" class="d-flex flex-column ga-4">
        <v-card rounded="xl" border>
          <v-card-item class="pa-6 pb-3">
            <v-card-title class="px-0 d-flex align-center ga-2">
              <v-icon size="18">mdi-fire</v-icon>
              热点话题
            </v-card-title>
          </v-card-item>

          <v-progress-linear v-if="loadingHotList" indeterminate color="primary" rounded />

          <v-list v-else-if="hotList.length" class="pt-0">
            <v-list-item
              v-for="item in hotList"
              :key="`hot-${item.id}`"
              @click="chooseHotTopic(item)"
            >
              <template #prepend>
                <v-chip :color="rankColor(item.rank)" variant="tonal" size="small">#{{ item.rank }}</v-chip>
              </template>

              <v-list-item-title>{{ item.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.desc || '点击筛选该话题内容' }}</v-list-item-subtitle>

              <template #append>
                <v-chip size="small" variant="text">
                  <v-icon start size="16">mdi-note-text-outline</v-icon>
                  {{ item.diaryCount }}
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

    <v-dialog v-model="hideDialog.visible" max-width="520">
      <v-card rounded="xl">
        <v-card-item class="pa-6 pb-2">
          <v-card-title>隐藏日记</v-card-title>
          <v-card-subtitle>{{ hideDialog.targetTitle || '请填写隐藏原因' }}</v-card-subtitle>
        </v-card-item>

        <v-card-text class="px-6 pb-4 pt-2 d-flex flex-column ga-4">
          <v-textarea
            v-model="hideDialog.reason"
            auto-grow
            hide-details
            label="隐藏原因"
            rows="4"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeHideDialog">取消</v-btn>
          <v-btn color="error" :loading="hideDialog.pending" @click="submitHideDiary">确认隐藏</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PaginationBar from '@/components/PaginationBar.vue'
import { DIARY_PAGE_SIZE_OPTIONS } from '@/constants/app'
import { hideDiaryByAdmin } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { formatDate } from '@/utils/format'
import { useFirefly } from '@/composables/useFirefly'

const router = useRouter()
const SnackBar = inject('snack', null)
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { profile } = storeToRefs(authStore)
const { diaryPageSize } = storeToRefs(preferencesStore)
const page = ref(1)
const keyword = ref('')
const selectedTopicId = ref(null)
const hideDialog = reactive({
  visible: false,
  targetId: '',
  targetTitle: '',
  reason: '',
  pending: false
})

const isAdmin = computed(() => Boolean(profile.value?.is_admin) || profile.value?.role === 'admin')

const {
  tabItems,
  loadingFeed,
  loadingHotList,
  loadingTopics,
  feedList,
  feedTotal,
  hotList,
  activeTab,
  activeTopicId,
  searchKeyword,
  fetchFeed,
  fetchTopicList,
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

function openHideDialog(item) {
  if (!isAdmin.value || !item?.id) {
    return
  }

  hideDialog.visible = true
  hideDialog.targetId = item.id
  hideDialog.targetTitle = item.title || '无标题日记'
  hideDialog.reason = ''
}

function closeHideDialog() {
  hideDialog.visible = false
  hideDialog.pending = false
  hideDialog.targetId = ''
  hideDialog.targetTitle = ''
  hideDialog.reason = ''
}

async function submitHideDiary() {
  const reason = String(hideDialog.reason || '').trim()

  if (!reason) {
    SnackBar?.({
      text: '请填写隐藏原因',
      color: 'warning',
      icon: 'mdi-alert-circle-outline'
    })
    return
  }

  hideDialog.pending = true

  try {
    await hideDiaryByAdmin({
      diary_id: hideDialog.targetId,
      reason
    })

    SnackBar?.({
      text: '帖子已隐藏',
      color: 'success',
      icon: 'mdi-check-circle-outline'
    })

    closeHideDialog()
    await loadFeed()
  } catch (error) {
    SnackBar?.({
      text: error.message || '隐藏操作失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  } finally {
    hideDialog.pending = false
  }
}

function loadFeed() {
  return fetchFeed({
    tab: activeTab.value,
    topicId: selectedTopicId.value,
    keyword: keyword.value,
    page: page.value,
    pageSize: diaryPageSize.value
  })
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

function applyFilters() {
  selectedTopicId.value = null
  resetToFirstPageAndLoad()
}

function handleClearSearch() {
  keyword.value = ''
  selectedTopicId.value = null
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

function chooseHotTopic(item) {
  if (!item?.id) {
    return
  }

  selectedTopicId.value = item.id
  keyword.value = ''
  resetToFirstPageAndLoad()
}

async function refreshAll() {
  keyword.value = searchKeyword.value
  selectedTopicId.value = activeTopicId.value

  await Promise.all([
    fetchTopicList(),
    loadFeed(),
    fetchHotList()
  ])
}

watch(page, (nextPage) => {
  fetchFeed({
    tab: activeTab.value,
    topicId: selectedTopicId.value,
    keyword: keyword.value,
    page: nextPage,
    pageSize: diaryPageSize.value
  })
})

onMounted(() => {
  refreshAll()
})
</script>
