import axios from 'axios'
import { getImagePresign } from './api'

export const ALLOWED_UPLOAD_TYPES = new Set(['diary', 'avatar'])
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpg',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/heic',
  'image/heif'
])
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
export const MIN_IMAGE_SIZE_BYTES = 1

function resolveUploadType(type = 'diary') {
  return ALLOWED_UPLOAD_TYPES.has(type) ? type : 'diary'
}

function parseImageDimension(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function parseImageSize(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

function normalizeCallbackPayload(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  if (payload.data && typeof payload.data === 'object') {
    return payload.data
  }

  return payload
}

function normalizeFilename(value) {
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

function buildUploadedImage(callbackPayload = {}, policy = {}, fallbackFile = null) {
  const normalized = normalizeCallbackPayload(callbackPayload)

  const filename = normalizeFilename(
    normalized.filename || policy?.filename || policy?.key || ''
  )

  if (!filename) {
    throw new Error('上传结果缺少文件名')
  }

  return {
    filename,
    width: parseImageDimension(normalized.width),
    height: parseImageDimension(normalized.height),
    size: parseImageSize(normalized.size || fallbackFile?.size)
  }
}

function extractSignatureValue(policy) {
  const signature = policy?.signature?.['x-oss-signature'] ||
    policy?.signature?.x_oss_signature ||
    policy?.x_oss_signature ||
    policy?.signature

  return typeof signature === 'string' || typeof signature === 'number'
    ? String(signature)
    : ''
}

function appendDecodedCallbackVars(formData, encodedCallbackVar) {
  if (!encodedCallbackVar) {
    return
  }

  let decoded = ''
  try {
    decoded = atob(String(encodedCallbackVar))
  } catch {
    throw new Error('callback_var 解码失败')
  }

  let entries = []

  try {
    const parsed = JSON.parse(decoded)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      entries = Object.entries(parsed)
    }
  } catch {
    const query = new URLSearchParams(decoded)
    entries = Array.from(query.entries())
  }

  if (!entries.length) {
    throw new Error('callback_var 格式异常')
  }

  entries.forEach(([key, value]) => {
    formData.append(String(key), String(value ?? ''))
  })
}

function validatePresignPolicy(policy) {
  if (!policy?.host || !policy?.policy || !policy?.key) {
    throw new Error('预签名响应格式异常')
  }

  if (!policy?.x_oss_signature_version || !policy?.x_oss_credential || !policy?.x_oss_date) {
    throw new Error('预签名响应缺少必要签名字段')
  }

  const signature = extractSignatureValue(policy)
  if (!signature) {
    throw new Error('预签名响应缺少 x-oss-signature')
  }

  return signature
}

function normalizeFileList(files) {
  if (!Array.isArray(files)) {
    return []
  }

  return files.filter(Boolean)
}

export function validateDiaryImageFile(file) {
  if (!file) {
    throw new Error('请选择要上传的图片')
  }

  const mimeType = String(file.type || '').toLowerCase()
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error('图片格式不支持，仅支持 jpg/png/jpeg/gif/heic/heif')
  }

  const fileSize = Number(file.size || 0)
  if (!Number.isFinite(fileSize) || fileSize < MIN_IMAGE_SIZE_BYTES || fileSize > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('图片大小需在 1B 到 10MB 之间')
  }
}

export function getUploadErrorMessage(error, options = {}) {
  const raw = String(error?.message || '').toLowerCase()
  const fallback = options.fallback || '上传失败，请重试'

  if (raw.includes('请选择要上传的图片')) {
    return '请选择图片后重试'
  }

  if (raw.includes('图片格式不支持') || raw.includes('mime') || raw.includes('content-type')) {
    return '图片格式不支持，请选择 JPG / PNG / GIF / HEIC / HEIF'
  }

  if (raw.includes('10mb') || raw.includes('图片大小') || raw.includes('too large') || raw.includes('entity too large')) {
    return '图片太大了，请选择 10MB 以内的图片'
  }

  if (
    error?.isNetworkError ||
    raw.includes('network') ||
    raw.includes('timeout') ||
    raw.includes('failed to fetch')
  ) {
    return '网络异常，请检查网络后重试'
  }

  return fallback
}

async function uploadSingleFile(file, type = 'diary') {
  const presignPayload = {
    type: resolveUploadType(type),
    mime_type: String(file.type || 'application/octet-stream'),
    size: Number(file.size || 0)
  }

  const policy = await getImagePresign(presignPayload)
  const signatureValue = validatePresignPolicy(policy)

  const formData = new FormData()
  formData.append('key', String(policy.key))
  formData.append('policy', String(policy.policy))
  formData.append('x-oss-signature-version', String(policy.x_oss_signature_version))
  formData.append('x-oss-credential', String(policy.x_oss_credential))
  formData.append('x-oss-date', String(policy.x_oss_date))
  formData.append('x-oss-signature', String(signatureValue))

  if (policy.callback) {
    formData.append('callback', String(policy.callback))
  }

  appendDecodedCallbackVars(formData, policy.callback_var)

  if (file.type) {
    formData.append('Content-Type', String(file.type))
  }

  formData.append('file', file)

  const response = await axios.post(policy.host, formData, {
    withCredentials: false,
    responseType: 'text'
  })

  let callbackPayload = null

  try {
    callbackPayload = typeof response.data === 'string'
      ? JSON.parse(response.data)
      : response.data
  } catch {
    callbackPayload = null
  }

  return buildUploadedImage(callbackPayload, policy, file)
}

export async function uploadImagesWithPresign(files, options = {}) {
  const validFiles = normalizeFileList(files)

  if (!validFiles.length) {
    return []
  }

  validFiles.forEach(validateDiaryImageFile)

  const uploadType = resolveUploadType(options.type || 'diary')
  const onFileComplete = typeof options.onFileComplete === 'function'
    ? options.onFileComplete
    : null

  const uploadedItems = []

  for (let index = 0; index < validFiles.length; index += 1) {
    const file = validFiles[index]
    const uploaded = await uploadSingleFile(file, uploadType)
    uploadedItems.push(uploaded)

    if (onFileComplete) {
      onFileComplete({
        uploadedCount: index + 1,
        totalCount: validFiles.length,
        currentFile: file,
        uploaded
      })
    }
  }

  return uploadedItems
}

export async function uploadAvatarImage(file) {
  validateDiaryImageFile(file)
  return uploadSingleFile(file, 'avatar')
}
