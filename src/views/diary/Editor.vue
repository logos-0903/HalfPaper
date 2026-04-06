<template>
  <div class="d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-6">
        <v-row align="center">
          <v-col cols="12" md="8">
            <div class="text-h5 font-weight-bold">{{ pageTitle }}</div>
            <div class="text-body-2 text-medium-emphasis mt-2">{{ pageSubtitle }}</div>
          </v-col>

          <v-col cols="12" md="4" class="d-flex justify-md-end">
            <v-chip :color="currentStatus === 'draft' ? 'warning' : 'success'" variant="tonal" size="large">
              {{ currentStatus === 'draft' ? '当前为草稿' : '当前为正式日记' }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" rounded />

    <v-row>
      <v-col cols="12" lg="8">
        <v-card rounded="xl" border>
          <v-card-text class="pa-6">
            <v-text-field v-model="form.title" clearable label="标题" maxlength="255" variant="outlined" />

            <v-textarea
              v-model="form.content"
              auto-grow
              clearable
              counter="5000"
              label="正文"
              rows="12"
              variant="outlined"
            />

            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="form.visibility" :items="VISIBILITY_OPTIONS" label="可见性" variant="outlined" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="form.weather" :items="WEATHER_OPTIONS" clearable label="天气" variant="outlined" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="form.mood" :items="MOOD_OPTIONS" clearable label="心情" variant="outlined" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.topic_id" clearable label="话题 ID" type="number" variant="outlined" />
              </v-col>
            </v-row>

            <v-alert class="mt-2" type="info" variant="tonal" rounded="xl">
              支持 JPEG/PNG/WebP/GIF/HEIC/HEIF，单张不超过 10MB，最多上传9张。
            </v-alert>

            <div class="mb-4 mt-3">
              <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-1">
                <div class="text-subtitle-2 font-weight-medium">上传照片（{{ totalImageCount }}/9）</div>
                <div class="text-caption text-medium-emphasis">支持 JPEG/PNG/GIF/HEIC/HEIF，单张不超过 10MB</div>
              </div>

              <v-alert
                v-if="pendingImageFiles.length"
                class="mb-2"
                density="comfortable"
                type="info"
                variant="tonal"
              >
                已选择 {{ pendingImageFiles.length }} 张待上传图片，点击保存草稿或发布日记后开始上传。
              </v-alert>

              <input
                ref="photoInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif"
                multiple
                class="d-none"
                @change="onPhotoChange"
              />

              <div class="photo-grid">
                <div
                  v-for="(url, index) in imagePreviewUrls"
                  :key="`${url}-${index}`"
                  class="photo-item"
                >
                  <v-img :src="url" cover class="photo-thumb">
                    <template #error>
                      <div class="d-flex align-center justify-center fill-height text-caption text-medium-emphasis">
                        加载失败
                      </div>
                    </template>
                  </v-img>
                  <v-btn
                    icon
                    size="x-small"
                    color="error"
                    class="photo-remove"
                    @click="removeImage(index)"
                  >
                    <v-icon size="14">mdi-close</v-icon>
                  </v-btn>
                </div>

                <button
                  v-if="totalImageCount < MAX_IMAGE_COUNT"
                  type="button"
                  class="photo-add"
                  @click="openPhotoPicker"
                >
                  <v-icon size="22">mdi-camera-plus-outline</v-icon>
                  <span>添加</span>
                </button>
              </div>

              <div v-if="uploadingPhotos" class="mt-3">
                <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-1">
                  <span>图片上传中</span>
                  <span>{{ uploadCompletedCount }}/{{ uploadTotalCount }}</span>
                </div>
                <v-progress-linear
                  :model-value="uploadProgressValue"
                  color="primary"
                />
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="px-6 pb-6">
            <v-btn variant="text" to="/manage/list">返回管理</v-btn>
            <v-spacer />
            <v-btn
              v-if="allowDraftAction"
              prepend-icon="mdi-content-save-outline"
              :loading="submitting"
              variant="tonal"
              @click="saveDraft"
            >
              保存草稿
            </v-btn>
            <v-btn
              color="primary"
              prepend-icon="mdi-send-outline"
              :loading="submitting"
              @click="handlePrimaryAction"
            >
              {{ primaryActionText }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card rounded="xl" border>
          <v-card-title>即时预览</v-card-title>
          <v-card-text>
            <div class="text-h6">{{ form.title || '无标题' }}</div>
            <div class="text-body-2 text-medium-emphasis mt-2">{{ summarizeText(form.content, 240) }}</div>

            <div class="d-flex flex-wrap ga-2 mt-4">
              <v-chip color="secondary" variant="tonal">{{ visibilityText(form.visibility) }}</v-chip>
              <v-chip v-if="form.weather" variant="tonal">天气 {{ form.weather }}</v-chip>
              <v-chip v-if="form.mood" variant="tonal">心情 {{ form.mood }}</v-chip>
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="xl" border class="mt-6">
          <v-card-title>编辑信息</v-card-title>
          <v-card-text>
            <v-list density="comfortable" lines="two">
              <v-list-item title="文稿状态" :subtitle="currentStatus === 'draft' ? '草稿，可继续补充后发布' : '正式日记，可继续修改内容'" />
              <v-list-item title="创建时间" :subtitle="formatDate(meta.created_at)" />
              <v-list-item title="最近更新时间" :subtitle="formatDate(meta.updated_at || meta.created_at)" />
              <v-list-item title="发布时间" :subtitle="formatDate(meta.published_at)" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL, MOOD_OPTIONS, VISIBILITY_OPTIONS, WEATHER_OPTIONS } from '@/constants/app'
import { createDiary, getDiaryDetail, updateDiary } from '@/services/api'
import { uploadImagesWithPresign, validateDiaryImageFile } from '@/services/upload'
import { formatDate, summarizeText } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const SnackBar = inject('snack', null)
const MAX_IMAGE_COUNT = 9

const loading = ref(false)
const submitting = ref(false)
const uploadingPhotos = ref(false)
const currentStatus = ref('draft')
const currentDiaryId = ref('')
const photoInput = ref(null)
const imageFiles = ref([])
const pendingImageFiles = ref([])
const uploadCompletedCount = ref(0)
const uploadTotalCount = ref(0)
const meta = reactive({
  created_at: null,
  updated_at: null,
  published_at: null
})

const form = reactive({
  title: '',
  content: '',
  visibility: 'private',
  weather: '',
  mood: '',
  topic_id: ''
})

const pageTitle = computed(() => {
  if (!route.params.id) return '写一篇新日记'
  return currentStatus.value === 'draft' ? '继续完善草稿' : '编辑已发布日记'
})

const pageSubtitle = computed(() => {
  if (!route.params.id) return '可以先保存为草稿，也可以直接发布。'
  return currentStatus.value === 'draft'
    ? '草稿会继续占用你的草稿箱名额，准备好后再发布。'
    : '修改正式日记时，接口会走 /diary/update。'
})

const allowDraftAction = computed(() => !route.params.id || currentStatus.value === 'draft')

const primaryActionText = computed(() => {
  if (route.params.id && currentStatus.value === 'active') {
    return '更新日记'
  }

  return '发布日记'
})

const imagePreviewUrls = computed(() => {
  return imageFiles.value
    .map((item) => item.previewUrl || resolveImagePreviewUrl(item))
    .filter(Boolean)
})

const totalImageCount = computed(() => imageFiles.value.length + pendingImageFiles.value.length)

const uploadProgressValue = computed(() => {
  if (!uploadTotalCount.value) {
    return 0
  }

  return Math.round((uploadCompletedCount.value / uploadTotalCount.value) * 100)
})

watch(() => route.params.id, (id) => {
  resetForm()

  if (id) {
    loadDiary(id)
  }
}, { immediate: true })

function resetForm() {
  currentDiaryId.value = ''
  currentStatus.value = 'draft'
  clearImageFiles()
  pendingImageFiles.value = []
  uploadCompletedCount.value = 0
  uploadTotalCount.value = 0
  meta.created_at = null
  meta.updated_at = null
  meta.published_at = null
  form.title = ''
  form.content = ''
  form.visibility = 'private'
  form.weather = ''
  form.mood = ''
  form.topic_id = ''
}

function visibilityText(value) {
  return VISIBILITY_OPTIONS.find((item) => item.value === value)?.title || value || '未设置'
}

function normalizePayload() {
  const topicValue = Number(form.topic_id)

  return {
    title: form.title.trim() || undefined,
    content: form.content.trim() || undefined,
    visibility: form.visibility || undefined,
    weather: form.weather || undefined,
    mood: form.mood || undefined,
    topic_id: Number.isFinite(topicValue) && form.topic_id !== '' ? topicValue : undefined,
    images: imageFiles.value.map((image) => ({
      filename: image.filename,
      width: Number(image.width || 0),
      height: Number(image.height || 0),
      size: Number(image.size || 0)
    }))
  }
}

function parseDiaryImages(images) {
  if (!images) {
    return []
  }

  let value = images

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      value = [value]
    }
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item) {
        return null
      }

      if (typeof item === 'string') {
        return {
          filename: item,
          width: 0,
          height: 0,
          size: 0
        }
      }

      const filename = String(item.filename || item.url || item.src || '').trim()
      if (!filename) {
        return null
      }

      return {
        filename,
        width: Number(item.width || 0),
        height: Number(item.height || 0),
        size: Number(item.size || 0),
        previewUrl: '',
        isObjectUrl: false
      }
    })
    .filter(Boolean)
}

function resolveImagePreviewUrl(image) {
  const filename = String(image?.filename || '').trim()

  if (!filename) {
    return ''
  }

  if (/^https?:\/\//i.test(filename) || /^blob:/i.test(filename) || /^data:/i.test(filename)) {
    return filename
  }

  if (filename.startsWith('/')) {
    return `${API_BASE_URL}${filename}`
  }

  return `${API_BASE_URL}/${filename.replace(/^\/+/, '')}`
}

function revokeObjectPreview(image) {
  if (!image?.isObjectUrl || !image?.previewUrl) {
    return
  }

  if (String(image.previewUrl).startsWith('blob:')) {
    URL.revokeObjectURL(image.previewUrl)
  }
}

function clearImageFiles() {
  imageFiles.value.forEach(revokeObjectPreview)
  imageFiles.value = []
}

function removeImage(index) {
  const removed = imageFiles.value[index]
  revokeObjectPreview(removed)
  imageFiles.value.splice(index, 1)
}

function openPhotoPicker() {
  if (uploadingPhotos.value || submitting.value) {
    return
  }

  photoInput.value?.click()
}

function onPhotoChange(event) {
  const target = event?.target
  const pickedFiles = Array.from(target?.files || [])

  if (target) {
    target.value = ''
  }

  if (!pickedFiles.length) {
    return
  }

  if (uploadingPhotos.value) {
    SnackBar?.({
      text: '图片上传中，请稍后再添加',
      color: 'warning',
      icon: 'mdi-alert-outline'
    })
    return
  }

  const validFiles = []

  pickedFiles.forEach((file) => {
    try {
      validateDiaryImageFile(file)
      validFiles.push(file)
    } catch (error) {
      SnackBar?.({
        text: error.message || '图片校验失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    }
  })

  if (!validFiles.length) {
    return
  }

  const remainCount = MAX_IMAGE_COUNT - totalImageCount.value

  if (remainCount <= 0) {
    SnackBar?.({
      text: `最多上传 ${MAX_IMAGE_COUNT} 张图片`,
      color: 'warning',
      icon: 'mdi-alert-outline'
    })
    return
  }

  let filesToUpload = validFiles

  if (validFiles.length > remainCount) {
    filesToUpload = validFiles.slice(0, remainCount)
    SnackBar?.({
      text: `最多还能添加 ${remainCount} 张，已自动截取前 ${remainCount} 张`,
      color: 'info',
      icon: 'mdi-information-outline'
    })
  }

  pendingImageFiles.value = [...pendingImageFiles.value, ...filesToUpload]

  SnackBar?.({
    text: `已选择 ${filesToUpload.length} 张图片，保存草稿或发布时自动上传`,
    color: 'info',
    icon: 'mdi-information-outline'
  })
}

async function uploadSelectedImages(files) {
  if (!Array.isArray(files) || !files.length) {
    return
  }

  uploadingPhotos.value = true
  uploadCompletedCount.value = 0
  uploadTotalCount.value = files.length

  try {
    const uploadedItems = await uploadImagesWithPresign(files, {
      type: 'diary',
      onFileComplete({ uploadedCount }) {
        uploadCompletedCount.value = uploadedCount
      }
    })

    const uploadedWithPreview = uploadedItems.map((uploaded, index) => {
      const currentFile = files[index]

      return {
        ...uploaded,
        previewUrl: URL.createObjectURL(currentFile),
        isObjectUrl: true
      }
    })

    imageFiles.value = [...imageFiles.value, ...uploadedWithPreview]

    SnackBar?.({
      text: '图片上传完成',
      color: 'success',
      icon: 'mdi-check-circle-outline'
    })
  } catch (error) {
    SnackBar?.({
      text: error.message || '上传图片失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  } finally {
    uploadingPhotos.value = false
  }
}

async function ensurePendingImagesUploaded() {
  if (!pendingImageFiles.value.length) {
    return true
  }

  const filesToUpload = [...pendingImageFiles.value]

  try {
    await uploadSelectedImages(filesToUpload)
    pendingImageFiles.value = []
    return true
  } catch {
    return false
  }
}

onBeforeUnmount(() => {
  clearImageFiles()
})

async function loadDiary(id) {
  loading.value = true

  try {
    const diary = await getDiaryDetail(id)

    currentDiaryId.value = diary.id
    currentStatus.value = diary.status || 'active'
    meta.created_at = diary.created_at
    meta.updated_at = diary.updated_at
    meta.published_at = diary.published_at

    form.title = diary.title || ''
    form.content = diary.content || ''
    form.visibility = diary.visibility || 'private'
    form.weather = diary.weather || ''
    form.mood = diary.mood || ''
    form.topic_id = diary.topic_id ?? ''
    imageFiles.value = parseDiaryImages(diary.images).slice(0, MAX_IMAGE_COUNT)
  } catch (error) {
    SnackBar?.({
      text: error.message || '读取日记详情失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
    router.replace('/manage/list')
  } finally {
    loading.value = false
  }
}

async function saveDraft() {
  if (uploadingPhotos.value) {
    SnackBar?.({
      text: '图片上传中，请稍后再保存草稿',
      color: 'warning',
      icon: 'mdi-alert-outline'
    })
    return
  }

  submitting.value = true

  try {
    const uploadReady = await ensurePendingImagesUploaded()

    if (!uploadReady) {
      return
    }

    const payload = normalizePayload()

    if (currentDiaryId.value && currentStatus.value === 'draft') {
      await updateDiary({
        diary_id: currentDiaryId.value,
        ...payload
      })
    } else {
      const result = await createDiary({
        type: 'draft',
        ...payload
      })

      currentDiaryId.value = result.id
      currentStatus.value = 'draft'
      router.replace(`/write/${result.id}`)
    }

    SnackBar?.({
      text: '草稿已保存',
      color: 'success',
      icon: 'mdi-check-circle-outline'
    })
  } catch (error) {
    SnackBar?.({
      text: error.message || '保存草稿失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  } finally {
    submitting.value = false
  }
}

async function handlePrimaryAction() {
  if (uploadingPhotos.value) {
    SnackBar?.({
      text: '图片上传中，请稍后再发布',
      color: 'warning',
      icon: 'mdi-alert-outline'
    })
    return
  }

  if (!form.title.trim() && !form.content.trim()) {
    SnackBar?.({
      text: '发布日记时标题和正文至少填写一项',
      color: 'warning',
      icon: 'mdi-alert-outline'
    })
    return
  }

  submitting.value = true

  try {
    const uploadReady = await ensurePendingImagesUploaded()

    if (!uploadReady) {
      return
    }

    const payload = normalizePayload()

    if (currentDiaryId.value && currentStatus.value === 'active') {
      await updateDiary({
        diary_id: currentDiaryId.value,
        ...payload
      })

      SnackBar?.({
        text: '日记更新成功',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })
      return
    }

    await createDiary({
      type: 'publish',
      ...(currentDiaryId.value ? { draft_id: currentDiaryId.value } : {}),
      ...payload
    })

    currentStatus.value = 'active'
    SnackBar?.({
      text: '日记发布成功',
      color: 'success',
      icon: 'mdi-check-circle-outline'
    })
    router.replace('/manage/list')
  } catch (error) {
    SnackBar?.({
      text: error.message || '提交日记失败',
      color: 'error',
      icon: 'mdi-alert-circle-outline'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.photo-item {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
}

.photo-thumb {
  width: 100%;
  height: 100%;
}

.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
}

.photo-add {
  width: 96px;
  height: 96px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 10px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
}
</style>