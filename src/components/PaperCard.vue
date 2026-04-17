<template>
  <v-card
    class="paper-card"
    :style="{
      backgroundColor: '#f5f5dc',
      backgroundImage: `
        radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(139, 69, 19, 0.05) 0%, transparent 50%),
        repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px, transparent 1px, transparent 24px)
      `,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      borderRadius: '8px'
    }"
    rounded="lg"
    elevation="2"
  >
    <v-card-text class="pa-6">
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup>
// 复古泛黄信纸效果组件
// 使用Vuetify v-card，添加内联样式模拟纸张质感
</script>

<style scoped>
.paper-card {
  position: relative;
  overflow: hidden;
}

.paper-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d2b48c' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}
</style>