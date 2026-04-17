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
        <!-- 登录设备 -->
        <v-card rounded="xl" border class="mb-5">
          <v-card-text class="pa-7 d-flex flex-column ga-5">
            <div class="d-flex flex-column flex-md-row align-md-center justify-space-between ga-3">
              <div>
                <div class="text-h6 font-weight-bold">登录设备</div>
                <div class="text-body-2 text-medium-emphasis mt-1">可以查看活跃会话，并手动下线某个设备或全部退登。</div>
              </div>
              <div class="d-flex flex-wrap ga-2">
                <v-btn variant="outlined" :loading="loadingSessions" @click="refreshSessions">刷新列表</v-btn>
                <v-btn color="error" variant="tonal" :loading="revokingAllSessions" @click="revokeAllUserSessions">
                  全部退登
                </v-btn>
              </div>
            </div>

            <v-progress-linear v-if="loadingSessions" color="primary" indeterminate rounded />

            <v-list v-else-if="sessions.length" class="session-list" lines="three">
              <v-list-item
                v-for="item in sessions"
                :key="item.session_id"
                rounded="lg"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar color="grey-lighten-4" rounded="lg" size="42">
                    <v-icon color="primary">mdi-devices</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="d-flex flex-wrap align-center ga-2">
                  <span class="font-weight-medium">{{ item.application }}</span>
                  <v-chip v-if="item.is_current" color="primary" size="small" variant="tonal">当前设备</v-chip>
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div class="session-meta">{{ item.location }} · {{ item.ip }}</div>
                  <div class="session-meta">登录于 {{ formatDate(item.created_at) }}</div>
                  <div class="session-meta">最近活跃 {{ item.last_seen_at ? formatDate(item.last_seen_at) : '暂无记录' }}</div>
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    color="error"
                    variant="text"
                    :loading="revokingSessionId === item.session_id"
                    @click="revokeSingleSession(item)"
                  >
                    {{ item.is_current ? '退出当前设备' : '下线' }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-alert v-else type="info" variant="tonal" rounded="lg">
              暂无可展示的活跃会话。
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- 修改密码 -->
        <v-card rounded="xl" border>
          <v-card-text class="pa-7 d-flex flex-column ga-5">
            <div>
              <div class="text-h6 font-weight-bold">修改密码</div>
              <div class="text-body-2 text-medium-emphasis mt-1">通过邮箱验证码验证身份后设置新密码。</div>
            </div>

            <v-alert v-if="accountAlert.show" :type="accountAlert.type" variant="tonal" rounded="lg">
              {{ accountAlert.text }}
            </v-alert>

            <v-form ref="accountFormRef" validate-on="input">
              <v-text-field
                :model-value="currentEmail"
                label="当前邮箱"
                prepend-inner-icon="mdi-email-outline"
                readonly
                variant="outlined"
                class="mb-4"
              />

              <v-text-field
                v-model="newPassword"
                label="新密码"
                type="password"
                autocomplete="new-password"
                variant="outlined"
                class="mb-4"
                :rules="[passwordRules.required, passwordRules.length, passwordRules.sameAsConfirm]"
              />

              <v-text-field
                v-model="confirmPassword"
                label="确认密码"
                type="password"
                autocomplete="new-password"
                variant="outlined"
                class="mb-4"
                :rules="[passwordRules.required, passwordRules.sameAsPassword]"
              />

              <v-row dense align="center" class="mb-2">
                <v-col cols="12" md="7">
                  <v-text-field
                    v-model="mailCode"
                    label="邮箱验证码"
                    prepend-inner-icon="mdi-shield-key-outline"
                    variant="outlined"
                    hide-details="auto"
                    :rules="[mailCodeRules.required, mailCodeRules.length]"
                  />
                </v-col>
                <v-col cols="12" md="5">
                  <v-btn
                    block
                    height="56"
                    variant="tonal"
                    :disabled="!canSendMailCode"
                    :loading="sendingMailCode"
                    @click="sendPasswordMailCode"
                  >
                    {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
                  </v-btn>
                </v-col>
              </v-row>

              <div class="mt-3">
                <div class="text-body-2 text-medium-emphasis mb-2">请完成人机验证</div>
                <VueHcaptcha ref="captchaRef" :sitekey="HCAPTCHA_SITE_KEY" @verify="onCaptchaVerify" @expired="resetCaptcha" />
              </div>
            </v-form>

            <div class="d-flex justify-end">
              <v-btn color="primary" :loading="submittingPassword" @click="submitPasswordChange">提交修改</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="permission">
        <v-card rounded="xl" border>
          <v-card-text class="pa-7 d-flex flex-column ga-5">
            <div class="text-h6 font-weight-bold">内容权限设置</div>
            <div class="text-body-2 text-medium-emphasis">管理你的日记互动权限。</div>

            <v-alert v-if="privacyAlert.show" :type="privacyAlert.type" variant="tonal" rounded="lg">
              {{ privacyAlert.text }}
            </v-alert>

            <v-row align="center">
              <v-col>
                <div class="text-body-1">是否允许他人评论日记</div>
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
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
import { useAccountSettings } from '@/composables/useAccountSettings'
import { usePrivacySettings } from '@/composables/usePrivacySettings'
import { useSessionSettings } from '@/composables/useSessionSettings'
import { HCAPTCHA_SITE_KEY } from '@/constants/app'
import { formatDate } from '@/utils/format'

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
  currentEmail,
  sendingMailCode,
  canSendMailCode,
  newPassword,
  confirmPassword,
  mailCode,
  mailCodeRules,
  captchaRef,
  countdown,
  onCaptchaVerify,
  resetCaptcha,
  submittingPassword,
  accountAlert,
  passwordRules,
  sendPasswordMailCode,
  submitPasswordChange
} = useAccountSettings()

const {
  sessions,
  loadingSessions,
  revokingSessionId,
  revokingAllSessions,
  loadSessions,
  revokeSingleSession,
  revokeAllUserSessions
} = useSessionSettings()

const {
  allowDiaryComments,
  privacyAlert
} = usePrivacySettings()

function refreshSessions() {
  return loadSessions().catch(() => {})
}

watch(activeTab, (tab) => {
  if (tab === 'security') {
    refreshSessions()
  }
}, { immediate: true })
</script>

<style scoped>
.session-list :deep(.v-list-item) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.session-list :deep(.v-list-item:last-child) {
  border-bottom: none;
}

.session-meta {
  line-height: 1.7;
}
</style>
