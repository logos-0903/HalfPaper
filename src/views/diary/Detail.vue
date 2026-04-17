<template>
  <div class="d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-7">
        <div class="d-flex justify-space-between align-start flex-wrap ga-4">
          <div class="d-flex flex-column ga-3">
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              class="align-self-start px-0"
              @click="goBack"
            >
              返回
            </v-btn>
            <div class="text-h4 font-weight-bold">{{ diary.title || '无标题日记' }}</div>

            <div class="d-flex flex-wrap ga-2">
              <v-chip :color="diary.status === 'draft' ? 'warning' : 'success'" variant="tonal">
                {{ diary.status === 'draft' ? '草稿' : '正式日记' }}
              </v-chip>
              <v-chip color="secondary" variant="tonal">{{ visibilityText(diary.visibility) }}</v-chip>
              <v-chip v-if="diary.mood" variant="tonal">心情 {{ diary.mood }}</v-chip>
              <v-chip v-if="diary.weather" variant="tonal">天气 {{ diary.weather }}</v-chip>
            </div>
          </div>

          <v-btn
            v-if="canShowAiEntry"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-robot-happy-outline"
            :loading="aiCardRef?.generating?.value"
            @click="handleOpenAiComfort"
          >
            与AI聊聊
          </v-btn>
        </div>

        <v-divider class="my-6" />

        <v-progress-linear v-if="loading" indeterminate color="primary" />

        <template v-else>
          <div class="text-body-1 detail-content">{{ diary.content || '这篇日记还没有正文。' }}</div>

          <div v-if="detailImages.length" class="d-flex flex-wrap ga-4 mt-6">
            <v-sheet
              v-for="(image, index) in detailImages"
              :key="`${image.url}-${index}`"
              border
              rounded
              width="200"
            >
              <v-img :src="image.url" cover height="200" width="200">
                <template #error>
                  <div class="d-flex align-center justify-center fill-height text-caption text-medium-emphasis text-center px-2">
                    图片加载失败
                  </div>
                </template>
              </v-img>
            </v-sheet>
          </div>
        </template>
      </v-card-text>
    </v-card>
    <div v-if="canShowAiEntry" ref="aiSectionRef">
      <AiComfortCard ref="aiCardRef" :diary-id="diary.id" @opened="scrollToAiSection" />
    </div>

    <v-card v-if="!loading && isPublishedDiary" rounded="xl" border>
      <v-card-title>评论区（{{ totalCommentCount }}）</v-card-title>
      <v-card-text class="pa-7 d-flex flex-column ga-4">
        <v-textarea
          v-model="draft.topLevel"
          label="写下你的评论"
          variant="outlined"
          rows="3"
          auto-grow
          maxlength="500"
          counter="500"
        />

        <div class="d-flex justify-end">
          <v-btn color="primary" :loading="submitting" @click="submitTopLevelComment">发表评论</v-btn>
        </div>

        <v-progress-linear v-if="loadingComments" indeterminate color="primary" />

        <v-alert
          v-else-if="!comments.length"
          type="info"
          variant="tonal"
          rounded="lg"
        >
          还没有评论，来写下第一条吧。
        </v-alert>

        <div v-else class="d-flex flex-column">
          <template v-for="(rootComment, index) in comments" :key="rootComment.id">
            <div class="py-3">
              <div class="d-flex align-start">
                <v-avatar size="34" color="secondary" variant="tonal" class="mr-3">
                  <v-img v-if="rootComment.member?.avatar" :src="rootComment.member.avatar" cover />
                  <span v-else>{{ (getMemberName(rootComment.member) || '匿').slice(0, 1) }}</span>
                </v-avatar>

                <div class="flex-grow-1">
                  <div class="d-flex align-center flex-wrap ga-2">
                    <span class="font-weight-medium">{{ getMemberName(rootComment.member) }}</span>
                  </div>
                  <div class="text-body-1 mt-1">{{ rootComment.content }}</div>
                  <div class="d-flex align-center flex-wrap ga-1 mt-2">
                    <span class="text-caption text-medium-emphasis">{{ formatCommentTime(rootComment.created_at) }}</span>
                    <v-btn
                      size="x-small"
                      variant="text"
                      :loading="isCommentLikeLoading(rootComment.id)"
                      @click="toggleRootCommentLike(rootComment)"
                    >
                      <v-icon start size="16">{{ rootComment.is_liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}</v-icon>
                      {{ rootComment.like_count || 0 }}
                    </v-btn>
                    <v-btn size="small" variant="text" @click="openReplyToRoot(rootComment)">回复</v-btn>
                  </div>

                  <div
                    class="mt-3 sub-reply-thread"
                    v-if="getRootReplies(rootComment).length || canShowLoadMore(rootComment) || isReplyingRoot(rootComment)"
                  >
                    <div
                      v-for="childComment in getRootReplies(rootComment)"
                      :key="childComment.id"
                      class="d-flex align-start py-2"
                    >
                      <v-avatar size="28" color="secondary" variant="tonal" class="mr-2 mt-1">
                        <v-img v-if="childComment.member?.avatar" :src="childComment.member.avatar" cover />
                        <span v-else>{{ (getMemberName(childComment.member) || '匿').slice(0, 1) }}</span>
                      </v-avatar>

                      <div class="flex-grow-1">
                        <div class="d-flex align-center flex-wrap ga-2">
                          <span class="font-weight-medium text-body-2">{{ getMemberName(childComment.member) }}</span>
                        </div>

                        <div class="text-body-2 mt-1">
                          <span class="text-primary" v-if="getReplyDisplayPrefix(rootComment, childComment, getRootReplies(rootComment))">
                            {{ getReplyDisplayPrefix(rootComment, childComment, getRootReplies(rootComment)) }}
                          </span>
                          <span>{{ childComment.content }}</span>
                        </div>

                        <div class="d-flex align-center flex-wrap ga-1 mt-1">
                          <span class="text-caption text-medium-emphasis">{{ formatCommentTime(childComment.created_at) }}</span>
                          <v-btn
                            size="x-small"
                            variant="text"
                            :loading="isCommentLikeLoading(childComment.id)"
                            @click="toggleChildCommentLike(rootComment, childComment)"
                          >
                            <v-icon start size="16">{{ childComment.is_liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}</v-icon>
                            {{ childComment.like_count || 0 }}
                          </v-btn>
                          <v-btn size="x-small" variant="text" @click="openReplyToChild(rootComment, childComment)">回复</v-btn>
                        </div>
                      </div>
                    </div>

                    <div class="mt-2" v-if="canShowLoadMore(rootComment)">
                      <v-btn
                        variant="text"
                        size="small"
                        :loading="rootReplyState[rootComment.id]?.loading"
                        @click="loadMoreReplies(rootComment)"
                      >
                        查看更多回复
                      </v-btn>
                    </div>

                    <div class="mt-3" v-if="isReplyingRoot(rootComment)">
                      <v-textarea
                        v-model="replyBox.content"
                        :label="`回复 ${replyBox.targetName}`"
                        variant="outlined"
                        rows="2"
                        auto-grow
                        maxlength="500"
                        counter="500"
                      />
                      <div class="d-flex justify-end ga-2 mt-2">
                        <v-btn variant="text" @click="cancelReply">取消</v-btn>
                        <v-btn color="primary" :loading="submitting" @click="submitReply">发送回复</v-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <v-divider v-if="index < comments.length - 1" />
          </template>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import AiComfortCard from '@/components/AiComfortCard.vue'
import { API_BASE_URL, VISIBILITY_OPTIONS } from '@/constants/app'
import { getDiaryDetail } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useDiaryComments } from '@/composables/useDiaryComments'

const route = useRoute()
const router = useRouter()
const SnackBar = inject('snack', null)
const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)

const loading = ref(false)
const aiSectionRef = ref(null)
const aiCardRef = ref(null)
const diary = reactive({
  id: '',
  userId: '',
  isOwner: null,
  title: '',
  content: '',
  images: [],
  visibility: 'private',
  mood: '',
  weather: '',
  status: 'active'
})

const detailImages = computed(() => {
  return parseImagesField(diary.images)
    .map((image) => {
      const raw = typeof image === 'string'
        ? image
        : image?.url || image?.src || image?.filename || ''

      const url = resolveImageUrl(raw)
      if (!url) {
        return null
      }

      return { url }
    })
    .filter(Boolean)
})

const isPublishedDiary = computed(() => diary.status === 'active')
const isFromFirefly = computed(() => String(route.query.source || '').toLowerCase() === 'firefly')
const isOwnerDiary = computed(() => {
  if (typeof diary.isOwner === 'boolean') {
    return diary.isOwner
  }

  const ownerId = String(diary.userId || '').trim()
  const currentUserId = String(profile.value?.uuid || profile.value?.id || '').trim()

  if (ownerId && currentUserId) {
    return ownerId === currentUserId
  }

  if (isFromFirefly.value) {
    return false
  }

  return true
})
const canShowAiEntry = computed(() => isOwnerDiary.value && isPublishedDiary.value && Boolean(diary.id))

const {
  loadingComments,
  comments,
  draft,
  replyBox,
  rootReplyState,
  submitting,
  totalCommentCount,
  formatCommentTime,
  getMemberName,
  getRootReplies,
  getReplyDisplayPrefix,
  canShowLoadMore,
  isCommentLikeLoading,
  isReplyingRoot,
  loadComments,
  loadMoreReplies,
  toggleRootCommentLike,
  toggleChildCommentLike,
  openReplyToRoot,
  openReplyToChild,
  cancelReply,
  submitTopLevelComment,
  submitReply
} = useDiaryComments()

watch(() => route.params.id, (id) => {
  if (!id) {
    router.replace('/manage/list')
    return
  }

  aiCardRef.value?.close()
  loadDiary(id)
}, { immediate: true })

function visibilityText(value) {
  return VISIBILITY_OPTIONS.find((item) => item.value === value)?.title || value || '未设置'
}

function goBack() {
  if (isFromFirefly.value) {
    router.push('/firefly')
    return
  }

  router.back()
}

function scrollToAiSection() {
  aiSectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

function handleOpenAiComfort() {
  if (!canShowAiEntry.value) {
    return
  }

  aiCardRef.value?.open()
}

function parseImagesField(images) {
  if (!images) {
    return []
  }

  let parsed = images

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      parsed = [parsed]
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
}

function resolveImageUrl(raw) {
  const value = String(raw || '').trim()

  if (!value) {
    return ''
  }

  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value) || /^data:/i.test(value)) {
    return value
  }

  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`
  }

  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`
}

async function loadDiary(id) {
  loading.value = true

  try {
    const detail = await getDiaryDetail(id)

    diary.id = detail.id || ''
    diary.userId = detail.user_id || detail.author?.id || detail.author?.uuid || ''
    diary.isOwner = typeof detail.is_owner === 'boolean' ? detail.is_owner : null
    diary.title = detail.title || ''
    diary.content = detail.content || ''
    diary.images = detail.images || []
    diary.visibility = detail.visibility || 'private'
    diary.mood = detail.mood || ''
    diary.weather = detail.weather || ''
    diary.status = detail.status || 'active'

    if (isPublishedDiary.value) {
      await loadComments(diary.id)
    } else {
      await loadComments('')
    }
  } catch (error) {
    SnackBar?.({
      text: error.message || '读取日记失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
    router.replace('/manage/list')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.detail-content {
  white-space: pre-wrap;
  line-height: 1.9;
}

.sub-reply-thread {
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  padding-left: 12px;
}
</style>
