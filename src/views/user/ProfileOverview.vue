<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <v-card rounded="xl" border class="mb-6">
          <v-card-text class="pa-7 d-flex flex-column flex-md-row align-md-start ga-5">
            <div class="d-flex flex-column align-center ga-2">
              <v-avatar rounded="lg" size="100" color="primary" variant="tonal">
                <v-img v-if="avatarUrl" :src="avatarUrl" cover />
                <span v-else class="text-h4">{{ (profile?.username || '半').slice(0, 1) }}</span>
              </v-avatar>
            </div>

            <div class="d-flex flex-column justify-center ga-3 flex-grow-1">
              <div class="text-h6 font-weight-bold">{{ profile?.username || '未命名用户' }}</div>
              <v-chip class="align-self-start" color="primary" variant="tonal" size="small">Lv.{{ levelInfo.levelNumber }} {{ levelInfo.levelName }}</v-chip>
              <div class="d-flex flex-wrap ga-2">
                <v-btn color="primary" prepend-icon="mdi-account-edit-outline" @click="goToEditor">编辑资料</v-btn>
              </div>
            </div>

            <div class="d-flex flex-column ga-3 ml-md-auto">
              <v-row dense>
                <v-col v-for="item in statsCards" :key="item.label" cols="6">
                  <v-sheet border rounded="lg" class="stats-chip pa-2 text-center">
                    <div class="text-caption text-medium-emphasis" style="font-size:11px">{{ item.label }}</div>
                    <div class="text-subtitle-1 font-weight-bold mt-1">{{ item.value }}</div>
                  </v-sheet>
                </v-col>
              </v-row>
            </div>
          </v-card-text>

          <v-card-text class="px-7 pt-0 pb-7">
            <v-sheet border rounded="lg" class="pa-5 level-panel">
              <div class="d-flex justify-space-between align-center mb-2">
                <v-chip color="primary" variant="outlined" size="small">
                  Lv.{{ levelInfo.levelNumber }}
                </v-chip>
                <v-chip v-if="!levelInfo.isMaxLevel" variant="outlined" size="small">
                  Lv.{{ levelInfo.levelNumber + 1 }}
                </v-chip>
                <v-chip v-else color="primary" variant="tonal" size="small">最高等级</v-chip>
              </div>

              <v-progress-linear
                color="primary"
                height="8"
                rounded
                :model-value="levelInfo.progressPercent"
              />

              <div class="text-caption text-medium-emphasis mt-2">
                {{ levelInfo.isMaxLevel ? '已达到最高等级' : `距离升级还需 ${levelInfo.nextLevelExp - levelInfo.currentExp} 经验值` }}
              </div>
            </v-sheet>
          </v-card-text>

          <v-divider />

          <v-card-text class="pa-7">
            <v-row>
              <v-col v-for="item in profileRows" :key="item.label" cols="12" md="6">
                <div class="profile-field">
                  <div class="text-caption text-medium-emphasis mb-1">{{ item.label }}</div>
                  <div class="text-body-1">{{ item.value }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useUserInfo } from '@/composables/useUserInfo'

const {
  profile,
  avatarUrl,
  levelInfo,
  statsCards,
  profileRows,
  goToEditor
} = useUserInfo()
</script>

<style scoped>
.stats-chip {
  min-width: 96px;
}

.profile-field {
  padding: 12px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
