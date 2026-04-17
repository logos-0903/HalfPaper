import { computed, inject, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/app'
import { listSchools, updateUserProfile } from '@/services/api'
import { getUploadErrorMessage, uploadAvatarImage, validateDiaryImageFile } from '@/services/upload'
import { useAuthStore } from '@/stores/auth'

const SEX_OPTIONS = [
  { title: '男', value: '男' },
  { title: '女', value: '女' },
  { title: '保密', value: '保密' },
  { title: '未知', value: '未知' }
]

const CROP_VIEW_SIZE = 280
const CROP_OUTPUT_SIZE = 512
const CROP_MIN_ZOOM = 1
const CROP_MAX_ZOOM = 4

export function useUserEditor() {
  const router = useRouter()
  const SnackBar = inject('snack', null)
  const authStore = useAuthStore()
  const { profile } = storeToRefs(authStore)

  const saving = ref(false)
  const uploadingAvatar = ref(false)
  const avatarSheet = ref(false)
  const cameraInput = ref(null)
  const albumInput = ref(null)
  const uploadedAvatarFilename = ref('')
  const birthdayMenu = ref(false)
  const schoolMenu = ref(false)
  const loadingSchools = ref(false)
  const schoolOptions = ref([])
  const schoolComposing = ref(false)
  const cropDialog = ref(false)
  const cropImageUrl = ref('')
  const cropPointerActive = ref(false)
  const cropStartPoint = reactive({
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0
  })
  const cropState = reactive({
    file: null,
    naturalWidth: 0,
    naturalHeight: 0,
    baseScale: 1,
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  })

  const form = reactive({
    username: '',
    schoolQuery: '',
    schoolCode: '',
    schoolCity: '',
    sex: '未知',
    birthday: '',
    sign: '',
    avatar: ''
  })

  let schoolSearchTimer = 0

  const avatarUrl = computed(() => resolveAvatarUrl(form.avatar))
  const cropZoom = computed({
    get: () => cropState.zoom,
    set: (value) => setCropZoom(value)
  })
  const cropZoomPercent = computed(() => `${Math.round(cropState.zoom * 100)}%`)
  const avatarCropImageStyle = computed(() => {
    if (!cropState.naturalWidth || !cropState.naturalHeight) {
      return {}
    }

    const scale = cropState.baseScale * cropState.zoom

    return {
      width: `${cropState.naturalWidth * scale}px`,
      height: `${cropState.naturalHeight * scale}px`,
      transform: `translate(calc(-50% + ${cropState.offsetX}px), calc(-50% + ${cropState.offsetY}px))`
    }
  })

  watch(profile, (currentProfile) => {
    hydrateFormFromProfile(currentProfile)
  }, { immediate: true })

  watch(cropDialog, (open) => {
    if (!open) {
      releaseCropSource()
    }
  })

  onBeforeUnmount(() => {
    clearSchoolSearchTimer()
    releaseCropSource()
  })

  function hydrateFormFromProfile(currentProfile) {
    form.username = currentProfile?.username || ''
    form.schoolQuery = currentProfile?.school || ''
    form.schoolCode = currentProfile?.school_code || ''
    form.schoolCity = currentProfile?.school_city || ''
    form.sex = normalizeSex(currentProfile?.sex)
    form.birthday = normalizeBirthday(currentProfile?.birthday)
    form.sign = currentProfile?.sign || ''
    form.avatar = currentProfile?.avatar || ''
    uploadedAvatarFilename.value = ''
  }

  function normalizeSex(value) {
    return ['男', '女', '保密', '未知'].includes(value) ? value : '未知'
  }

  function normalizeBirthday(value) {
    if (Array.isArray(value)) {
      return normalizeBirthday(value[0])
    }

    if (!value) {
      return ''
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return ''
    }

    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`
  }

  function pad2(value) {
    return String(value).padStart(2, '0')
  }

  function resolveAvatarUrl(value) {
    const avatar = String(value || '').trim()

    if (!avatar) {
      return ''
    }

    if (/^https?:\/\//i.test(avatar) || /^blob:/i.test(avatar) || /^data:/i.test(avatar)) {
      return avatar
    }

    if (avatar.startsWith('/')) {
      return `${API_BASE_URL}${avatar}`
    }

    return `${API_BASE_URL}/${avatar.replace(/^\/+/, '')}`
  }

  function goBack() {
    router.push('/user/info')
  }

  function openAvatarActionSheet() {
    if (uploadingAvatar.value) {
      return
    }

    avatarSheet.value = true
  }

  function openCamera() {
    avatarSheet.value = false
    cameraInput.value?.click()
  }

  function openAlbum() {
    avatarSheet.value = false
    albumInput.value?.click()
  }

  function clearInputValue(target) {
    if (target) {
      target.value = ''
    }
  }

  async function onAvatarFileChange(event) {
    const target = event?.target
    const file = target?.files?.[0]
    clearInputValue(target)

    if (!file) {
      return
    }

    try {
      validateDiaryImageFile(file)

      const imageMeta = await readImageMeta(file)
      if (isSquareImage(imageMeta.width, imageMeta.height)) {
        await handleAvatarUpload(file)
        return
      }

      openCropDialog(file, imageMeta)
    } catch (error) {
      console.error('[avatar image parse error]', error)
      SnackBar?.({
        text: getUploadErrorMessage(error, { fallback: '头像图片处理失败，请重试' }),
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    }
  }

  async function handleAvatarUpload(file) {
    if (uploadingAvatar.value) {
      return false
    }

    const originalAvatar = form.avatar
    const originalFilename = uploadedAvatarFilename.value
    uploadingAvatar.value = true

    try {
      validateDiaryImageFile(file)

      const uploaded = await uploadAvatarImage(file)
      uploadedAvatarFilename.value = uploaded.filename

      const nextAvatar = resolveAvatarUrl(uploaded.filename)
      if (nextAvatar) {
        form.avatar = nextAvatar
      }

      SnackBar?.({
        text: '头像已更新，保存资料后生效',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })

      return true
    } catch (error) {
      console.error('[avatar upload error]', error)
      form.avatar = originalAvatar
      uploadedAvatarFilename.value = originalFilename

      SnackBar?.({
        text: getUploadErrorMessage(error, { fallback: '头像上传失败，请重试' }),
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })

      return false
    } finally {
      uploadingAvatar.value = false
    }
  }

  async function readImageMeta(file) {
    const objectUrl = URL.createObjectURL(file)

    try {
      const image = await loadImageElement(objectUrl)
      return {
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  function isSquareImage(width, height) {
    return Math.abs(Number(width || 0) - Number(height || 0)) <= 2
  }

  function openCropDialog(file, imageMeta) {
    releaseCropSource()

    const width = Number(imageMeta?.width || 0)
    const height = Number(imageMeta?.height || 0)

    if (!width || !height) {
      throw new Error('图片解析失败')
    }

    cropImageUrl.value = URL.createObjectURL(file)
    cropState.file = file
    cropState.naturalWidth = width
    cropState.naturalHeight = height
    cropState.baseScale = Math.max(CROP_VIEW_SIZE / width, CROP_VIEW_SIZE / height)
    cropState.zoom = 1
    cropState.offsetX = 0
    cropState.offsetY = 0
    cropDialog.value = true
  }

  function closeCropDialog() {
    cropDialog.value = false
  }

  function releaseCropSource() {
    if (cropImageUrl.value && cropImageUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(cropImageUrl.value)
    }

    cropImageUrl.value = ''
    cropPointerActive.value = false
    cropState.file = null
    cropState.naturalWidth = 0
    cropState.naturalHeight = 0
    cropState.baseScale = 1
    cropState.zoom = 1
    cropState.offsetX = 0
    cropState.offsetY = 0
  }

  function setCropZoom(nextZoom) {
    const safeZoom = clamp(Number(nextZoom) || 1, CROP_MIN_ZOOM, CROP_MAX_ZOOM)
    cropState.zoom = safeZoom
    applyCropOffset(cropState.offsetX, cropState.offsetY)
  }

  function zoomInCrop() {
    setCropZoom(cropState.zoom + 0.1)
  }

  function zoomOutCrop() {
    setCropZoom(cropState.zoom - 0.1)
  }

  function resetCropPosition() {
    cropState.zoom = 1
    cropState.offsetX = 0
    cropState.offsetY = 0
  }

  function onCropWheel(event) {
    if (!cropDialog.value) {
      return
    }

    const delta = event.deltaY < 0 ? 0.08 : -0.08
    setCropZoom(cropState.zoom + delta)
  }

  function onCropPointerDown(event) {
    if (!cropDialog.value) {
      return
    }

    cropPointerActive.value = true
    cropStartPoint.x = event.clientX
    cropStartPoint.y = event.clientY
    cropStartPoint.offsetX = cropState.offsetX
    cropStartPoint.offsetY = cropState.offsetY

    if (typeof event.currentTarget?.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  function onCropPointerMove(event) {
    if (!cropPointerActive.value) {
      return
    }

    const deltaX = event.clientX - cropStartPoint.x
    const deltaY = event.clientY - cropStartPoint.y
    applyCropOffset(cropStartPoint.offsetX + deltaX, cropStartPoint.offsetY + deltaY)
  }

  function onCropPointerUp(event) {
    cropPointerActive.value = false

    if (typeof event.currentTarget?.releasePointerCapture === 'function') {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // ignore pointer capture release errors
      }
    }
  }

  function applyCropOffset(rawX, rawY) {
    const renderWidth = cropState.naturalWidth * cropState.baseScale * cropState.zoom
    const renderHeight = cropState.naturalHeight * cropState.baseScale * cropState.zoom

    const limitX = Math.max(0, (renderWidth - CROP_VIEW_SIZE) / 2)
    const limitY = Math.max(0, (renderHeight - CROP_VIEW_SIZE) / 2)

    cropState.offsetX = clamp(rawX, -limitX, limitX)
    cropState.offsetY = clamp(rawY, -limitY, limitY)
  }

  async function onCropConfirm() {
    if (!cropState.file || uploadingAvatar.value) {
      return
    }

    try {
      const croppedFile = await exportCroppedAvatarFile()
      const success = await handleAvatarUpload(croppedFile)

      if (success) {
        closeCropDialog()
      }
    } catch (error) {
      console.error('[avatar crop confirm error]', error)

      SnackBar?.({
        text: '头像裁剪失败，请重试',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    }
  }

  async function exportCroppedAvatarFile() {
    if (!cropState.file || !cropImageUrl.value) {
      throw new Error('没有可裁剪的图片')
    }

    const image = await loadImageElement(cropImageUrl.value)
    const canvas = document.createElement('canvas')
    canvas.width = CROP_OUTPUT_SIZE
    canvas.height = CROP_OUTPUT_SIZE

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('头像裁剪失败')
    }

    const scale = cropState.baseScale * cropState.zoom
    const renderWidth = cropState.naturalWidth * scale
    const renderHeight = cropState.naturalHeight * scale
    const drawX = (CROP_VIEW_SIZE / 2) + cropState.offsetX - (renderWidth / 2)
    const drawY = (CROP_VIEW_SIZE / 2) + cropState.offsetY - (renderHeight / 2)
    const sourceSize = CROP_VIEW_SIZE / scale

    const sourceX = clamp((0 - drawX) / scale, 0, (image.naturalWidth || image.width) - sourceSize)
    const sourceY = clamp((0 - drawY) / scale, 0, (image.naturalHeight || image.height) - sourceSize)

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      CROP_OUTPUT_SIZE,
      CROP_OUTPUT_SIZE
    )

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('头像裁剪失败'))
          return
        }

        resolve(result)
      }, 'image/jpeg', 0.92)
    })

    return new File([blob], buildAvatarFileName(cropState.file.name), { type: 'image/jpeg' })
  }

  async function loadImageElement(src) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('图片解析失败'))
      image.src = src
    })
  }

  function buildAvatarFileName(rawName) {
    const source = String(rawName || 'avatar').trim()
    const stem = source.includes('.') ? source.slice(0, source.lastIndexOf('.')) : source

    return `${stem || 'avatar'}-cropped.jpg`
  }

  function onBirthdayPicked(value) {
    form.birthday = normalizeBirthday(value)
    birthdayMenu.value = false
  }

  function clearBirthday() {
    form.birthday = ''
  }

  function clearSchoolSearchTimer() {
    if (schoolSearchTimer) {
      window.clearTimeout(schoolSearchTimer)
      schoolSearchTimer = 0
    }
  }

  function normalizeSchoolOption(item) {
    return {
      code: String(item?.code || ''),
      name: String(item?.name || ''),
      city: String(item?.city || ''),
      department: String(item?.department || ''),
      level: String(item?.level || ''),
      remark: String(item?.remark || '')
    }
  }

  async function fetchSchoolOptions(query = '') {
    loadingSchools.value = true

    try {
      const data = await listSchools({
        pn: 1,
        ps: 20,
        q: String(query || '').trim() || undefined
      })

      schoolOptions.value = (data?.lists || []).map(normalizeSchoolOption)
      schoolMenu.value = true
    } catch (error) {
      schoolOptions.value = []

      SnackBar?.({
        text: error.message || '学校搜索失败',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      loadingSchools.value = false
    }
  }

  function scheduleSchoolSearch(query = '') {
    clearSchoolSearchTimer()

    schoolSearchTimer = window.setTimeout(() => {
      fetchSchoolOptions(query)
    }, 320)
  }

  function onSchoolInput(value) {
    const nextValue = String(value || '')
    form.schoolQuery = nextValue

    const matchedCurrent = schoolOptions.value.find((item) => item.code === form.schoolCode)
    if (!matchedCurrent || matchedCurrent.name !== nextValue.trim()) {
      form.schoolCode = ''
      form.schoolCity = ''
    }

    if (schoolComposing.value) {
      return
    }

    scheduleSchoolSearch(nextValue)
  }

  function onSchoolCompositionStart() {
    schoolComposing.value = true
  }

  function onSchoolCompositionEnd(event) {
    schoolComposing.value = false
    onSchoolInput(event?.target?.value ?? form.schoolQuery)
  }

  function onSchoolFocus() {
    schoolMenu.value = true

    if (!schoolOptions.value.length) {
      scheduleSchoolSearch(form.schoolQuery)
    }
  }

  function onSchoolBlur() {
    window.setTimeout(() => {
      schoolMenu.value = false
    }, 160)
  }

  function clearSchoolSelection() {
    form.schoolQuery = ''
    form.schoolCode = ''
    form.schoolCity = ''
    schoolMenu.value = false
  }

  function selectSchool(option) {
    form.schoolQuery = option?.name || ''
    form.schoolCode = option?.code || ''
    form.schoolCity = option?.city || ''
    schoolMenu.value = false
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  function validateProfileForm() {
    if (!form.username.trim()) {
      return '请输入用户名'
    }

    if (form.username.trim().length < 5 || form.username.trim().length > 16) {
      return '用户名需为 5 到 16 位'
    }

    if (!['男', '女', '保密', '未知'].includes(form.sex)) {
      return '请选择性别'
    }

    if (form.schoolQuery.trim() && !form.schoolCode) {
      return '请选择学校列表中的有效项'
    }

    return ''
  }

  function buildProfilePayload() {
    const currentProfile = profile.value || {}
    const nextUsername = form.username.trim()
    const nextSex = form.sex
    const nextSign = form.sign.trim()
    const nextBirthday = form.birthday || ''
    const nextSchoolCode = form.schoolCode || ''
    const payload = {}

    if (nextUsername !== String(currentProfile.username || '').trim()) {
      payload.username = nextUsername
    }

    if (nextSex !== normalizeSex(currentProfile.sex)) {
      payload.sex = nextSex
    }

    if (nextSign !== String(currentProfile.sign || '').trim()) {
      payload.sign = nextSign || ''
    }

    if (nextBirthday !== normalizeBirthday(currentProfile.birthday)) {
      payload.birthday = nextBirthday || ''
    }

    if (nextSchoolCode !== String(currentProfile.school_code || '')) {
      payload.school_code = nextSchoolCode || ''
    }

    return payload
  }

  async function saveProfile() {
    if (saving.value) {
      return
    }

    const validationMessage = validateProfileForm()
    if (validationMessage) {
      SnackBar?.({
        text: validationMessage,
        color: 'warning',
        icon: 'mdi-alert-outline'
      })
      return
    }

    saving.value = true

    const payload = buildProfilePayload()

    if (!Object.keys(payload).length) {
      saving.value = false
      SnackBar?.({
        text: '未检测到资料变更',
        color: 'info',
        icon: 'mdi-information-outline'
      })
      return
    }

    try {
      const serverProfile = await updateUserProfile(payload)
      const mergedProfile = {
        ...(profile.value || {}),
        ...(serverProfile || {})
      }

      if (mergedProfile.avatar) {
        mergedProfile.avatar = resolveAvatarUrl(mergedProfile.avatar)
      }

      authStore.setProfile(mergedProfile)
      uploadedAvatarFilename.value = ''

      SnackBar?.({
        text: '资料保存成功',
        color: 'success',
        icon: 'mdi-check-circle-outline'
      })

      router.replace('/user/info')
    } catch (error) {
      console.error('[profile save error]', error)
      SnackBar?.({
        text: '保存失败，请稍后重试',
        color: 'error',
        icon: 'mdi-alert-circle-outline'
      })
    } finally {
      saving.value = false
    }
  }

  return {
    form,
    SEX_OPTIONS,
    avatarUrl,
    avatarSheet,
    cameraInput,
    albumInput,
    birthdayMenu,
    schoolMenu,
    loadingSchools,
    schoolOptions,
    uploadingAvatar,
    saving,
    cropDialog,
    cropImageUrl,
    cropZoom,
    cropZoomPercent,
    avatarCropImageStyle,
    goBack,
    openAvatarActionSheet,
    openCamera,
    openAlbum,
    onAvatarFileChange,
    closeCropDialog,
    onCropConfirm,
    onCropWheel,
    onCropPointerDown,
    onCropPointerMove,
    onCropPointerUp,
    zoomInCrop,
    zoomOutCrop,
    resetCropPosition,
    onBirthdayPicked,
    clearBirthday,
    onSchoolInput,
    onSchoolCompositionStart,
    onSchoolCompositionEnd,
    onSchoolFocus,
    onSchoolBlur,
    clearSchoolSelection,
    selectSchool,
    saveProfile
  }
}
