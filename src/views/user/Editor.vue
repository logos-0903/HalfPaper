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
                <v-menu v-model="birthdayMenu" :close-on-content-click="false" location="bottom" transition="scale-transition">
                  <template #activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      :model-value="formattedBirthday"
                      label="生日"
                      variant="outlined"
                      readonly
                      append-inner-icon="mdi-calendar-month-outline"
                    />
                  </template>

                  <v-card min-width="320" rounded="lg">
                    <v-date-picker
                      :model-value="form.birthday || null"
                      :min="minBirthdayDate"
                      :max="maxBirthdayDate"
                      locale="zh-hans"
                      show-adjacent-months
                      @update:model-value="onBirthdayPicked"
                    />
                    <v-divider />
                    <div class="d-flex justify-space-between pa-3">
                      <v-btn variant="text" @click="clearBirthday">清空生日</v-btn>
                      <v-btn variant="text" color="primary" @click="birthdayMenu = false">完成</v-btn>
                    </div>
                  </v-card>
                </v-menu>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.school" label="学校" variant="outlined" maxlength="100" />
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

    <v-dialog v-model="avatarSheet" max-width="400">
      <v-card rounded="xl">
        <v-list lines="one">
          <v-list-item prepend-icon="mdi-camera" title="拍照" :disabled="uploadingAvatar" @click="openCamera" />
          <v-list-item prepend-icon="mdi-image-multiple-outline" title="从相册选取" :disabled="uploadingAvatar" @click="openAlbum" />
          <v-list-item prepend-icon="mdi-close" title="取消" @click="avatarSheet = false" />
        </v-list>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cropDialog" max-width="720" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center">
          手动裁剪头像
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" :disabled="uploadingAvatar" @click="closeCropDialog" />
        </v-card-title>

        <v-card-text class="pa-7">
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
import { computed } from 'vue'
import { useUserEditor } from '@/composables/useUserEditor'

const {
  form,
  SEX_OPTIONS,
  avatarUrl,
  avatarSheet,
  cameraInput,
  albumInput,
  birthdayMenu,
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
  saveProfile
} = useUserEditor()

const currentYear = new Date().getFullYear()
const minBirthdayDate = `${currentYear - 100}-01-01`
const maxBirthdayDate = new Date().toISOString().split('T')[0]

const formattedBirthday = computed(() => {
  if (!form.birthday) return '未设置'
  const d = new Date(form.birthday)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})
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
  width: min(100%, 380px);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(120, 120, 120, 0.35);
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
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}
</style>
