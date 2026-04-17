/**
 * 日记编辑器 ViewModel
 * 统一管理日记的创建/编辑状态、图片上传、草稿保存、发布流程
 */
import { computed, inject, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL, MOOD_OPTIONS, VISIBILITY_OPTIONS, WEATHER_OPTIONS } from '@/constants/app'
import { createDiary, getDiaryDetail, getFireflyTopicList, updateDiary } from '@/services/api'
import { getUploadErrorMessage, uploadImagesWithPresign, validateDiaryImageFile } from '@/services/upload'
import { formatDate, summarizeText } from '@/utils/format'

export function useDiaryEditorViewModel() {
  const route = useRoute()
  const router = useRouter()
  const SnackBar = inject('snack', null)
  const MAX_IMAGE_COUNT = 9

  const loading = ref(false)
  const loadingTopics = ref(false)
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

  const topicOptions = ref([])

  const isFireflyMode = computed(() => route.query.source === 'firefly')

  const pageTitle = computed(() => {
    if (!route.params.id) return '新建日记'
    return currentStatus.value === 'draft' ? '编辑草稿' : '编辑日记'
  })

  const allowDraftAction = computed(() => !route.params.id || currentStatus.value === 'draft')

  const primaryActionText = computed(() => {
    if (route.params.id && currentStatus.value === 'active') {
      return '更新日记'
    }

    return '发布日记'
  })

  const imagePreviewUrls = computed(() => {
    const uploadedPreviews = imageFiles.value
      .map((item) => item.previewUrl || resolveImagePreviewUrl(item))
      .filter(Boolean)

    const pendingPreviews = pendingImageFiles.value
      .map((item) => item.previewUrl)
      .filter(Boolean)

    return [...uploadedPreviews, ...pendingPreviews]
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

  loadTopicOptions()

  function resetForm() {
    currentDiaryId.value = ''
    currentStatus.value = 'draft'
    clearImageFiles()
    clearPendingImageFiles()
    uploadCompletedCount.value = 0
    uploadTotalCount.value = 0
    meta.created_at = null
    meta.updated_at = null
    meta.published_at = null
    form.title = ''
    form.content = ''
    form.visibility = isFireflyMode.value ? 'public' : 'private'
    form.weather = ''
    form.mood = ''
    form.topic_id = ''
  }

  function visibilityText(value) {
    return VISIBILITY_OPTIONS.find((item) => item.value === value)?.title || value || '未设置'
  }

  async function loadTopicOptions() {
    loadingTopics.value = true

    try {
      const data = await getFireflyTopicList()
      topicOptions.value = (data?.list || []).map((item) => ({
        title: item?.name || `话题 ${item?.id ?? ''}`,
        value: item?.id,
        desc: item?.desc || ''
      }))
    } catch (error) {
      topicOptions.value = []
      SnackBar?.({
        text: error.message || '获取话题列表失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      loadingTopics.value = false
    }
  }

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.push('/manage/list')
  }

  function normalizeDiaryFilename(value) {
    const raw = String(value || '').trim()

    if (!raw) {
      return ''
    }

    const noQuery = raw.split('?')[0]
    const lastPart = noQuery.split('/').pop() || ''
    const strict32 = lastPart.match(/^([A-Za-z0-9_-]{32})(?:\.[A-Za-z0-9]+)?$/)

    if (strict32) {
      return strict32[1]
    }

    return lastPart
  }

  function resolveDiaryIdFromResult(result, fallback = '') {
    const candidates = [
      result?.id,
      result?.diary_id,
      result?.diaryId,
      result?.data?.id,
      fallback
    ]

    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null || candidate === '') {
        continue
      }

      return String(candidate)
    }

    return ''
  }

  function normalizePayload() {
    const topicValue = Number(form.topic_id)

    return {
      title: String(form.title || '').trim() || undefined,
      content: String(form.content || '').trim() || undefined,
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
            filename: normalizeDiaryFilename(item),
            width: 0,
            height: 0,
            size: 0,
            previewUrl: resolveImagePreviewUrl({ filename: item }),
            isObjectUrl: false
          }
        }

        const rawPreview = String(item.url || item.src || item.filename || '').trim()
        const filename = normalizeDiaryFilename(item.filename || rawPreview)

        if (!filename && !rawPreview) {
          return null
        }

        return {
          filename,
          width: Number(item.width || 0),
          height: Number(item.height || 0),
          size: Number(item.size || 0),
          previewUrl: resolveImagePreviewUrl({ filename: rawPreview }),
          isObjectUrl: false
        }
      })
      .filter(Boolean)
  }

  function resolveImagePreviewUrl(image) {
    const filename = String(image?.previewUrl || image?.url || image?.src || image?.filename || '').trim()

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

  function clearPendingImageFiles() {
    pendingImageFiles.value.forEach((item) => {
      if (item?.previewUrl && String(item.previewUrl).startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl)
      }
    })

    pendingImageFiles.value = []
  }

  function removeImage(index) {
    if (index < imageFiles.value.length) {
      const removedUploaded = imageFiles.value[index]
      revokeObjectPreview(removedUploaded)
      imageFiles.value.splice(index, 1)
      return
    }

    const pendingIndex = index - imageFiles.value.length
    const removedPending = pendingImageFiles.value[pendingIndex]

    if (removedPending?.previewUrl && String(removedPending.previewUrl).startsWith('blob:')) {
      URL.revokeObjectURL(removedPending.previewUrl)
    }

    pendingImageFiles.value.splice(pendingIndex, 1)
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
        console.error('[upload validation error]', error)
        SnackBar?.({
          text: getUploadErrorMessage(error, { fallback: '图片校验失败，请重新选择' }),
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

    const pendingItems = filesToUpload.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }))

    pendingImageFiles.value = [...pendingImageFiles.value, ...pendingItems]
  }

  async function uploadSelectedImages(files, pendingItems = []) {
    if (!Array.isArray(files) || !files.length) {
      return true
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
        const previewUrl = pendingItems[index]?.previewUrl || URL.createObjectURL(files[index])

        return {
          ...uploaded,
          previewUrl,
          isObjectUrl: true
        }
      })

      imageFiles.value = [...imageFiles.value, ...uploadedWithPreview]

      SnackBar?.({
        text: '图片上传完成',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })

      return true
    } catch (error) {
      console.error('[upload error]', error)
      SnackBar?.({
        text: getUploadErrorMessage(error),
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })

      return false
    } finally {
      uploadingPhotos.value = false
    }
  }

  async function ensurePendingImagesUploaded() {
    if (!pendingImageFiles.value.length) {
      return true
    }

    const pendingItems = [...pendingImageFiles.value]
    const filesToUpload = pendingItems.map((item) => item.file)

    const uploaded = await uploadSelectedImages(filesToUpload, pendingItems)

    if (!uploaded) {
      return false
    }

    pendingImageFiles.value = []
    return true
  }

  onBeforeUnmount(() => {
    clearImageFiles()
    clearPendingImageFiles()
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
        text: error.message || '读取日记失败',
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

        currentDiaryId.value = resolveDiaryIdFromResult(result, currentDiaryId.value)
        currentStatus.value = 'draft'
      }

      SnackBar?.({
        text: '草稿已保存',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })

      router.replace('/manage/list')
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

    if (!String(form.title || '').trim() && !String(form.content || '').trim()) {
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

        router.replace(`/diary/detail/${currentDiaryId.value}`)
        return
      }

      const result = await createDiary({
        type: 'publish',
        ...(currentDiaryId.value ? { draft_id: currentDiaryId.value } : {}),
        ...payload
      })

      const publishedDiaryId = resolveDiaryIdFromResult(result, currentDiaryId.value)

      currentStatus.value = 'active'
      SnackBar?.({
        text: '日记发布成功',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })

      if (publishedDiaryId) {
        currentDiaryId.value = publishedDiaryId
        router.replace(`/diary/detail/${publishedDiaryId}`)
      } else {
        router.replace('/manage/list')
      }
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

  return {
    loading,
    loadingTopics,
    goBack,
    pageTitle,
    currentStatus,
    form,
    isFireflyMode,
    topicOptions,
    VISIBILITY_OPTIONS,
    WEATHER_OPTIONS,
    MOOD_OPTIONS,
    totalImageCount,
    pendingImageFiles,
    photoInput,
    onPhotoChange,
    imagePreviewUrls,
    removeImage,
    openPhotoPicker,
    MAX_IMAGE_COUNT,
    uploadingPhotos,
    uploadCompletedCount,
    uploadTotalCount,
    uploadProgressValue,
    allowDraftAction,
    submitting,
    saveDraft,
    handlePrimaryAction,
    primaryActionText,
    summarizeText,
    visibilityText,
    meta,
    formatDate
  }
}
