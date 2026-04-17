<template>
  <v-container fluid class="pa-0 d-flex flex-column ga-6">
    <v-card rounded="xl" border>
          <v-card-text class="pa-7">
            <div class="d-flex align-center mb-4">
              <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">返回</v-btn>
              <v-spacer />
              <v-btn color="primary" prepend-icon="mdi-content-save-outline" :loading="saving" @click="saveProfile">保存资料</v-btn>
            </div>

            <div class="mt-6 d-flex flex-column align-center ga-3">
              <button
                type="button"
                class="avatar-trigger"
                :disabled="uploadingAvatar"
                @click="openAvatarActionSheet"
              >
                <v-avatar size="104" color="primary" variant="tonal">
                  <v-progress-circular v-if="uploadingAvatar" indeterminate color="primary" size="34" width="3" />
                  <v-img v-else-if="avatarUrl" :src="avatarUrl" cover />
                  <span v-else class="text-h4">半</span>
                </v-avatar>
              </button>
            </div>

            <input
              ref="cameraInput"
              class="d-none"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/heic,image/heif"
              capture="environment"
              @change="onAvatarFileChange"
            />
            <input
              ref="albumInput"
              class="d-none"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/heic,image/heif"
              @change="onAvatarFileChange"
            />

            <v-row class="mt-2">
              <v-col cols="12" md="6">
                <v-text-field v-model="form.username" label="用户名" variant="outlined" maxlength="32" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  :model-value="formattedBirthday"
                  label="生日"
                  variant="outlined"
                  readonly
                  append-inner-icon="mdi-calendar-month-outline"
                  @click="birthdayDialog = true"
                />
              </v-col>

              <v-col cols="12" md="6">
                <div class="position-relative">
                  <v-text-field
                    :model-value="form.schoolQuery"
                    label="学校"
                    variant="outlined"
                    maxlength="100"
                    clearable
                    :loading="loadingSchools"
                    @update:model-value="onSchoolInput"
                    @click:clear="clearSchoolSelection"
                    @focus="onSchoolFocus"
                    @blur="onSchoolBlur"
                    @compositionstart="onSchoolCompositionStart"
                    @compositionend="onSchoolCompositionEnd"
                  />

                  <v-card v-if="schoolMenu" class="school-panel" rounded="lg" border>
                    <v-progress-linear v-if="loadingSchools" indeterminate color="primary" />

                    <v-list v-else-if="schoolOptions.length" lines="two" density="comfortable">
                      <v-list-item
                        v-for="item in schoolOptions"
                        :key="item.code"
                        :title="item.name"
                        :subtitle="[item.city, item.level, item.department].filter(Boolean).join(' · ')"
                        @mousedown.prevent="selectSchool(item)"
                      >
                        <template #append>
                          <span class="text-caption text-medium-emphasis">{{ item.code }}</span>
                        </template>
                      </v-list-item>
                    </v-list>

                    <v-card-text v-else class="py-4 text-body-2 text-medium-emphasis">
                      未找到匹配学校，请换个关键词再试。
                    </v-card-text>
                  </v-card>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="form.sex" :items="SEX_OPTIONS" label="性别" variant="outlined" />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.sign"
                  label="个性签名"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  maxlength="200"
                  counter="200"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

    <v-dialog v-model="birthdayDialog" max-width="360">
      <v-card rounded="xl">
        <v-date-picker
          v-model="birthdayPickerValue"
          :max="maxBirthdayDate"
          :min="minBirthdayDate"
          color="primary"
          show-adjacent-months
          width="100%"
        />
        <v-card-actions class="px-4 pb-4 pt-0">
          <v-btn variant="text" @click="clearBirthday">清除</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="birthdayDialog = false">取消</v-btn>
          <v-btn color="primary" variant="tonal" @click="confirmBirthday">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="avatarSheet" max-width="400">
      <v-card rounded="xl">
        <v-list lines="one">
          <v-list-item prepend-icon="mdi-camera" title="拍照" :disabled="uploadingAvatar" @click="openCamera" />
          <v-list-item prepend-icon="mdi-image-multiple-outline" title="从相册选取" :disabled="uploadingAvatar" @click="openAlbum" />
          <v-list-item prepend-icon="mdi-close" title="取消" @click="avatarSheet = false" />
        </v-list>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cropDialog" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center">
          手动裁剪头像
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" :disabled="uploadingAvatar" @click="closeCropDialog" />
        </v-card-title>

        <v-card-text class="pa-5">
          <div
            class="crop-stage"
            @wheel.prevent="onCropWheel"
            @pointerdown="onCropPointerDown"
            @pointermove="onCropPointerMove"
            @pointerup="onCropPointerUp"
            @pointercancel="onCropPointerUp"
            @pointerleave="onCropPointerUp"
          >
            <img
              v-if="cropImageUrl"
              :src="cropImageUrl"
              :style="avatarCropImageStyle"
              class="crop-image"
              draggable="false"
            />
            <div class="crop-frame" />
          </div>

          <div class="d-flex align-center ga-2 mt-4">
            <v-btn icon="mdi-magnify-minus-outline" variant="tonal" :disabled="uploadingAvatar" @click="zoomOutCrop" />
            <v-slider
              v-model="cropZoom"
              class="flex-1-1"
              :min="1"
              :max="4"
              :step="0.01"
              hide-details
              density="compact"
              color="primary"
            />
            <v-btn icon="mdi-magnify-plus-outline" variant="tonal" :disabled="uploadingAvatar" @click="zoomInCrop" />
          </div>

          <div class="d-flex justify-space-between align-center mt-2 text-caption text-medium-emphasis">
            <span>拖动图片调整取景，可用滚轮或滑杆缩放</span>
            <span>{{ cropZoomPercent }}</span>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" :disabled="uploadingAvatar" @click="resetCropPosition">重置</v-btn>
          <v-spacer />
          <v-btn variant="text" :disabled="uploadingAvatar" @click="closeCropDialog">取消</v-btn>
          <v-btn color="primary" :loading="uploadingAvatar" @click="onCropConfirm">确认并上传</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useUserEditor } from '@/composables/useUserEditor'

const {
  form,
  SEX_OPTIONS,
  avatarUrl,
  avatarSheet,
  cameraInput,
  albumInput,
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
  onSchoolInput,
  onSchoolCompositionStart,
  onSchoolCompositionEnd,
  onSchoolFocus,
  onSchoolBlur,
  clearSchoolSelection,
  selectSchool,
  saveProfile
} = useUserEditor()

const currentYear = new Date().getFullYear()
const minBirthdayDate = new Date(currentYear - 100, 0, 1)
const maxBirthdayDate = new Date()

const birthdayDialog = ref(false)
const birthdayPickerValue = ref(null)

const formattedBirthday = computed(() => {
  if (!form.birthday) return ''
  const d = new Date(form.birthday)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

function confirmBirthday() {
  if (birthdayPickerValue.value) {
    const d = new Date(birthdayPickerValue.value)
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      form.birthday = `${y}-${m}-${day}`
    }
  }
  birthdayDialog.value = false
}

function clearBirthday() {
  form.birthday = ''
  birthdayPickerValue.value = null
  birthdayDialog.value = false
}
</script>

<style scoped>
.avatar-trigger {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 999px;
  transition: opacity 0.2s ease;
}

.avatar-trigger:hover {
  opacity: 0.9;
}

.avatar-trigger:active {
  opacity: 0.7;
}

.avatar-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.crop-stage {
  position: relative;
  width: min(100%, 280px);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(120, 120, 120, 0.35);
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.18), rgba(0, 0, 0, 0.24));
  touch-action: none;
}

.crop-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.crop-frame {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(255, 255, 255, 0.86);
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.position-relative {
  position: relative;
}

.school-panel {
  position: absolute;
  top: calc(100% - 12px);
  left: 0;
  right: 0;
  z-index: 10;
  max-height: 280px;
  overflow-y: auto;
}
</style>
