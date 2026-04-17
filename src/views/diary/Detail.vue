<template>
  <div class="detail-page d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-7">
        <div class="d-flex justify-space-between align-start flex-wrap ga-4">
          <div class="d-flex flex-column ga-3">
            <v-btn variant="text" prepend-icon="mdi-arrow-left" class="align-self-start px-0" @click="goBack">
              返回
            </v-btn>
            <div class="text-h4 font-weight-bold">{{ diary.title || '无标题日记' }}</div>

            <div class="d-flex flex-wrap ga-2">
              <v-chip v-if="diary.mood" variant="tonal">心情 {{ diary.mood }}</v-chip>
              <v-chip v-if="diary.weather" variant="tonal">天气 {{ diary.weather }}</v-chip>
            </div>


          </div>

          <v-btn v-if="canShowAiEntry" color="primary" variant="tonal" prepend-icon="mdi-robot-happy-outline"
            :loading="aiCardRef?.generating?.value" @click="handleOpenAiComfort">
            与AI聊聊
          </v-btn>
        </div>

        <v-divider class="my-6" />

        <v-progress-linear v-if="loading" indeterminate color="primary" />

        <template v-else>
          <div class="text-body-1 detail-content">{{ diary.content || '这篇日记还没有正文。' }}</div>

          <div v-if="detailImages.length" class="d-flex flex-wrap ga-4 mt-6">
            <v-sheet v-for="(image, index) in detailImages" :key="`${image.url}-${index}`" border rounded width="200">
              <v-img :src="image.url" cover height="200" width="200">
                <template #error>
                  <div
                    class="d-flex align-center justify-center fill-height text-caption text-medium-emphasis text-center px-2">
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

    <v-card v-if="!loading && isPublishedDiary" ref="commentSectionRef" rounded="xl" border>
      <v-card-title>评论区（{{ totalCommentCount }}）</v-card-title>
      <v-card-text class="pa-7 d-flex flex-column ga-4">
        <v-textarea v-model="draft.topLevel" label="写下你的评论" variant="outlined" rows="3" auto-grow maxlength="500"
          counter="500" />

        <div class="d-flex justify-end">
          <v-btn color="primary" :loading="submitting" @click="submitTopLevelComment">发表评论</v-btn>
        </div>

        <v-progress-linear v-if="loadingComments" indeterminate color="primary" />

        <v-alert v-else-if="!comments.length" type="info" variant="tonal" rounded="lg">
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
                    <span class="text-caption text-medium-emphasis">{{ formatCommentTime(rootComment.created_at)
                      }}</span>
                    <v-btn size="x-small" variant="text" :loading="isCommentLikeLoading(rootComment.id)"
                      @click="toggleRootCommentLike(rootComment)">
                      <v-icon start size="16">{{ rootComment.is_liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'
                        }}</v-icon>
                      {{ rootComment.like_count || 0 }}
                    </v-btn>
                    <v-btn size="small" variant="text" @click="openReplyToRoot(rootComment)">回复</v-btn>
                    <v-btn v-if="canRemoveComment(rootComment)" size="small" variant="text" color="error"
                      :loading="isCommentDeleting(rootComment.id)" @click="removeComment(rootComment)">删除</v-btn>
                  </div>

                  <div class="mt-3 sub-reply-thread"
                    v-if="getRootReplies(rootComment).length || canShowLoadMore(rootComment) || isReplyingRoot(rootComment)">
                    <div v-for="childComment in getRootReplies(rootComment)" :key="childComment.id"
                      class="d-flex align-start py-2">
                      <v-avatar size="28" color="secondary" variant="tonal" class="mr-2 mt-1">
                        <v-img v-if="childComment.member?.avatar" :src="childComment.member.avatar" cover />
                        <span v-else>{{ (getMemberName(childComment.member) || '匿').slice(0, 1) }}</span>
                      </v-avatar>

                      <div class="flex-grow-1">
                        <div class="d-flex align-center flex-wrap ga-2">
                          <span class="font-weight-medium text-body-2">{{ getMemberName(childComment.member) }}</span>
                        </div>

                        <div class="text-body-2 mt-1">
                          <span class="text-primary"
                            v-if="getReplyDisplayPrefix(rootComment, childComment, getRootReplies(rootComment))">
                            {{ getReplyDisplayPrefix(rootComment, childComment, getRootReplies(rootComment)) }}
                          </span>
                          <span>{{ childComment.content }}</span>
                        </div>

                        <div class="d-flex align-center flex-wrap ga-1 mt-1">
                          <span class="text-caption text-medium-emphasis">{{ formatCommentTime(childComment.created_at)
                            }}</span>
                          <v-btn size="x-small" variant="text" :loading="isCommentLikeLoading(childComment.id)"
                            @click="toggleChildCommentLike(rootComment, childComment)">
                            <v-icon start size="16">{{ childComment.is_liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'
                              }}</v-icon>
                            {{ childComment.like_count || 0 }}
                          </v-btn>
                          <v-btn size="x-small" variant="text"
                            @click="openReplyToChild(rootComment, childComment)">回复</v-btn>
                          <v-btn v-if="canRemoveComment(childComment)" size="x-small" variant="text" color="error"
                            :loading="isCommentDeleting(childComment.id)"
                            @click="removeComment(childComment)">删除</v-btn>
                        </div>
                      </div>
                    </div>

                    <div class="mt-2" v-if="canShowLoadMore(rootComment)">
                      <v-btn variant="text" size="small" :loading="rootReplyState[rootComment.id]?.loading"
                        @click="loadMoreReplies(rootComment)">
                        查看更多回复
                      </v-btn>
                    </div>

                    <div class="mt-3" v-if="isReplyingRoot(rootComment)">
                      <v-textarea v-model="replyBox.content" :label="`回复 ${replyBox.targetName}`" variant="outlined"
                        rows="2" auto-grow maxlength="500" counter="500" />
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

    <div v-if="canFavoriteDiary" class="detail-action-rail">
      <v-sheet rounded="lg" border color="surface" class="detail-action-panel py-4 px-3">
        <div class="d-flex flex-column align-center" style="gap: 16px;">
          <div class="action-item" @click="handleToggleLike">
            <v-icon :color="diary.is_liked ? 'primary' : undefined" size="28">
              {{ diary.is_liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}
            </v-icon>
            <span class="text-caption text-medium-emphasis">{{ diary.like_count || 0 }}</span>
          </div>

          <div class="action-item" @click="scrollToComments">
            <v-icon size="28">mdi-comment-outline</v-icon>
            <span class="text-caption text-medium-emphasis">{{ totalCommentCount || 0 }}</span>
          </div>

          <div class="action-item" @click="handleToggleFavorite">
            <v-icon :color="diary.is_favorited ? 'primary' : undefined" size="28">
              {{ diary.is_favorited ? 'mdi-bookmark' : 'mdi-bookmark-outline' }}
            </v-icon>
            <span class="text-caption text-medium-emphasis">{{ diary.favorite_count || 0 }}</span>
          </div>

          <div class="action-item" @click="openShareDialog">
            <v-icon size="28">mdi-share-variant-outline</v-icon>
          </div>
        </div>
      </v-sheet>
    </div>

    <v-dialog v-model="shareDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-item class="pa-6 pb-2">
          <v-card-title>复制链接</v-card-title>
          <v-card-subtitle>将当前日记链接复制后即可转发。</v-card-subtitle>
        </v-card-item>

        <v-card-text class="px-6 pb-4 pt-2">
          <v-text-field :model-value="shareUrl" readonly variant="outlined" hide-details />
        </v-card-text>

        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="shareDialog = false">关闭</v-btn>
          <v-btn color="primary" @click="copyShareLink">复制链接</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import AiComfortCard from '@/components/AiComfortCard.vue'
import { useFavorite } from '@/composables/useFavorite'
import { API_BASE_URL, VISIBILITY_OPTIONS } from '@/constants/app'
import { getDiaryDetail, likeDiary, unlikeDiary } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useDiaryComments } from '@/composables/useDiaryComments'

const route = useRoute()
const router = useRouter()
const SnackBar = inject('snack', null)
const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)
const { toggleFavorite } = useFavorite()

const loading = ref(false)
const aiSectionRef = ref(null)
const aiCardRef = ref(null)
const commentSectionRef = ref(null)
const shareDialog = ref(false)
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
  status: 'active',
  is_liked: false,
  like_count: 0,
  is_favorited: false,
  favorite_count: 0
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
const canFavoriteDiary = computed(() => isPublishedDiary.value && Boolean(diary.id))
const shareUrl = computed(() => {
  if (typeof window === 'undefined') {
    return route.fullPath || ''
  }

  return window.location.href
})

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
  canRemoveComment,
  getRootReplies,
  getReplyDisplayPrefix,
  canShowLoadMore,
  isCommentLikeLoading,
  isCommentDeleting,
  isReplyingRoot,
  loadComments,
  loadMoreReplies,
  removeComment,
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

function scrollToComments() {
  commentSectionRef.value?.$el?.scrollIntoView?.({
    behavior: 'smooth',
    block: 'start'
  })
}

function openShareDialog() {
  shareDialog.value = true
}

async function copyShareLink() {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      throw new Error('当前环境不支持复制')
    }

    await navigator.clipboard.writeText(shareUrl.value)
    shareDialog.value = false
    SnackBar?.({
      text: '链接已复制',
      color: 'success',
      icon: 'mdi-check-circle-outline'
    })
  } catch (error) {
    SnackBar?.({
      text: error.message || '复制链接失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  }
}

async function handleToggleLike() {
  if (!canFavoriteDiary.value) {
    return
  }

  const previous = Boolean(diary.is_liked)
  const previousCount = Number(diary.like_count || 0)
  const nextLiked = !previous

  diary.is_liked = nextLiked
  diary.like_count = Math.max(0, previousCount + (nextLiked ? 1 : -1))

  try {
    const data = nextLiked
      ? await likeDiary(diary.id)
      : await unlikeDiary(diary.id)

    if (data && typeof data === 'object') {
      diary.is_liked = typeof data.is_liked === 'boolean' ? data.is_liked : nextLiked
      diary.like_count = Number(data.like_count ?? diary.like_count ?? 0)
    }
  } catch (error) {
    diary.is_liked = previous
    diary.like_count = previousCount
    SnackBar?.({
      text: error.message || '点赞操作失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  }
}

function handleToggleFavorite() {
  if (!canFavoriteDiary.value) {
    return
  }

  toggleFavorite(diary, {
    onError: (error) => {
      SnackBar?.({
        text: error.message || '收藏操作失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    }
  })
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
    diary.is_liked = Boolean(detail.is_liked)
    diary.like_count = Number(detail.like_count ?? 0)
    diary.is_favorited = Boolean(detail.is_favorited)
    diary.favorite_count = Number(detail.favorite_count ?? 0)

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

.detail-action-rail {
  position: fixed;
  top: 50%;
  right: clamp(16px, calc((100vw - 1200px) / 2 + 100px), 96px);
  transform: translateY(-50%);
  z-index: 10;
}

.detail-action-panel {
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 2px;
  min-width: 40px;
}

@media (max-width: 1260px) {
  .detail-action-rail {
    right: 20px;
  }
}

@media (max-width: 960px) {
  .detail-action-rail {
    position: static;
    transform: none;
    top: auto;
    right: auto;
    align-self: flex-end;
  }
}
</style>
