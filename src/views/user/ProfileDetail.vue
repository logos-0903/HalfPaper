<template>
  <v-container fluid class="pa-0">
    <v-tabs
      v-model="activeTab"
      show-arrows
      color="primary"
    >
      <v-tab
        v-for="item in tabs"
        :key="item.tab"
        :value="item.tab"
      >
        <v-icon size="20" start>{{ item.icon }}</v-icon>
        {{ item.title }}
      </v-tab>
    </v-tabs>

    <v-window
      v-model="activeTab"
      class="mt-5"
      :touch="false"
    >
      <v-window-item value="security">
        <v-card rounded="xl" border>
          <v-card-text class="pa-7 d-flex flex-column ga-4">
            <div class="text-h6 font-weight-bold">隐私安全设置</div>

            <v-alert v-if="accountAlert.show" :type="accountAlert.type" variant="tonal" rounded="lg">
              {{ accountAlert.text }}
            </v-alert>

            <v-form ref="accountFormRef" validate-on="input">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newPassword"
                    label="新密码"
                    type="password"
                    autocomplete="new-password"
                    variant="outlined"
                    :rules="[passwordRules.required, passwordRules.length, passwordRules.sameAsConfirm]"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="confirmPassword"
                    label="确认密码"
                    type="password"
                    autocomplete="new-password"
                    variant="outlined"
                    :rules="[passwordRules.required, passwordRules.sameAsPassword]"
                  />
                </v-col>
              </v-row>
            </v-form>

            <div class="d-flex justify-end">
              <v-btn color="primary" :loading="submittingPassword" @click="submitPasswordChange">提交修改</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="permission">
        <v-card rounded="xl" border>
          <v-card-text class="pa-7 d-flex flex-column ga-4">
            <div class="text-h6 font-weight-bold">内容权限设置</div>

            <v-alert v-if="privacyAlert.show" :type="privacyAlert.type" variant="tonal" rounded="lg">
              {{ privacyAlert.text }}
            </v-alert>

            <v-row align="center">
              <v-col>
                <div>是否允许他人评论日记</div>
              </v-col>
              <v-col cols="auto">
                <v-switch
                  v-model="allowDiaryComments"
                  color="primary"
                  inset
                  hide-details
                />
              </v-col>
            </v-row>

            <v-select
              v-model="privacyDefaultVisibility"
              :items="visibilityItems"
              label="日记默认可见性"
              variant="outlined"
              hide-details
            />

            <v-divider />

            <div class="d-flex justify-end">
              <v-btn color="error" variant="tonal" prepend-icon="mdi-delete-alert-outline" @click="openClearDialog">
                清空所有日记
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="editor">
        <v-card rounded="xl" border>
          <v-card-text class="pa-7 d-flex flex-column ga-4">
            <div class="text-h6 font-weight-bold">编辑器设置</div>

            <v-alert v-if="editorAlert.show" :type="editorAlert.type" variant="tonal" rounded="lg">
              {{ editorAlert.text }}
            </v-alert>

            <v-row align="center">
              <v-col>
                <div>新建日记是否同步隐私设置中的默认可见性</div>
              </v-col>
              <v-col cols="auto">
                <v-switch
                  v-model="syncPrivacyToEditor"
                  color="primary"
                  inset
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <v-dialog v-model="clearDiaryDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title>确认清空所有日记</v-card-title>
        <v-card-text class="pa-7">
          <v-alert type="warning" variant="tonal" rounded="lg">
            该操作不可恢复，将删除你的全部草稿与已发布日记，请谨慎确认。
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" :disabled="clearingAllDiaries" @click="closeClearDialog">取消</v-btn>
          <v-btn color="error" :loading="clearingAllDiaries" @click="confirmClearAllDiaries">确认清空</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountSettings } from '@/composables/useAccountSettings'
import { usePrivacySettings } from '@/composables/usePrivacySettings'
import { useEditorSettings } from '@/composables/useEditorSettings'

const route = useRoute()
const router = useRouter()

const tabs = [
  {
    title: '隐私安全',
    icon: 'mdi-shield-lock-outline',
    tab: 'security'
  },
  {
    title: '内容权限',
    icon: 'mdi-book-lock-outline',
    tab: 'permission'
  },
  {
    title: '编辑器设置',
    icon: 'mdi-file-document-edit-outline',
    tab: 'editor'
  }
]

const validTabs = tabs.map((item) => item.tab)
const activeTab = ref('security')

function normalizeTab(value) {
  const current = String(value || '').trim()
  return validTabs.includes(current) ? current : 'security'
}

watch(() => route.params.tab, (nextTab) => {
  const normalized = normalizeTab(nextTab)

  if (activeTab.value !== normalized) {
    activeTab.value = normalized
  }

  if (String(nextTab || '') !== normalized) {
    router.replace(`/settings/${normalized}`)
  }
}, { immediate: true })

watch(activeTab, (tab) => {
  const current = normalizeTab(route.params.tab)

  if (tab !== current) {
    router.push(`/settings/${tab}`)
  }
})

const {
  accountFormRef,
  newPassword,
  confirmPassword,
  submittingPassword,
  accountAlert,
  passwordRules,
  submitPasswordChange
} = useAccountSettings()

const {
  visibilityItems,
  allowDiaryComments,
  privacyDefaultVisibility,
  clearDiaryDialog,
  clearingAllDiaries,
  privacyAlert,
  openClearDialog,
  closeClearDialog,
  confirmClearAllDiaries
} = usePrivacySettings()

const {
  syncPrivacyToEditor,
  editorAlert
} = useEditorSettings()
</script>
