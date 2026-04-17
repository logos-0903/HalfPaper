<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <v-card rounded="xl" border class="mb-6">
          <v-card-text class="pa-7 d-flex flex-column flex-md-row align-md-center ga-5">
            <v-avatar rounded="lg" size="100" color="primary" variant="tonal">
              <v-img v-if="avatarUrl" :src="avatarUrl" cover />
              <span v-else class="text-h4">{{ (profile?.username || '半').slice(0, 1) }}</span>
            </v-avatar>

            <div class="d-flex flex-column justify-center ga-3">
              <div class="text-h6 font-weight-bold">{{ profile?.username || '未命名用户' }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ profile?.sign || '这个人还没有留下签名。' }}</div>
              <div class="d-flex flex-wrap ga-2">
                <v-btn color="primary" prepend-icon="mdi-account-edit-outline" @click="goToEditor">编辑资料</v-btn>
              </div>
            </div>

            <div class="d-flex flex-column ga-3">
              <v-row dense>
                <v-col v-for="item in statsCards.slice(0, 2)" :key="item.label" cols="6">
                  <v-sheet border rounded="lg" class="stats-chip pa-3">
                    <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                    <div class="text-h6 mt-1">{{ item.value }}</div>
                  </v-sheet>
                </v-col>
              </v-row>
              <v-row dense>
                <v-col v-for="item in statsCards.slice(2)" :key="item.label" cols="6">
                  <v-sheet border rounded="lg" class="stats-chip pa-3">
                    <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                    <div class="text-h6 mt-1">{{ item.value }}</div>
                  </v-sheet>
                </v-col>
              </v-row>
            </div>
          </v-card-text>

          <v-divider />

          <v-card-text class="pa-7">
            <v-row>
              <v-col v-for="item in profileRows" :key="item.label" cols="12" md="6">
                <v-text-field
                  :label="item.label"
                  :model-value="item.value"
                  readonly
                  variant="outlined"
                  disabled
                />
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
  statsCards,
  profileRows,
  goToEditor
} = useUserInfo()
</script>

<style scoped>
.stats-chip {
  min-width: 120px;
}
</style>
