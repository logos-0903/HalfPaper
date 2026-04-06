<template>
  <!-- 将 v-model 改为 :modelValue 和 @update:modelValue 的组合 -->
  <v-navigation-drawer
    :modelValue="drawer"
    @update:modelValue="$emit('update:drawer', $event)"
    :rail="!isMobile"
    :permanent="!isMobile"
    app
    color="surface"
  >
    <!-- 侧边栏内容保持不变 -->
    <v-list density="compact">
      <!-- 首页 -->
      <v-list-item 
        :active="isRouteActive('/')"
        router
        to="/"
        class="mb-1"
      >
        <v-list-item-icon>
          <v-icon>mdi-home</v-icon>
        </v-list-item-icon>
        <v-list-item-title>首页</v-list-item-title>
      </v-list-item>
      
      <!-- 用户信息 -->
      <v-list-item 
        :active="isRouteActive('/user/info')"
        router
        to="/user/info"
        class="mb-1"
      >
        <v-list-item-icon>
          <v-icon>mdi-account-box</v-icon>
        </v-list-item-icon>
        <v-list-item-title>用户信息</v-list-item-title>
      </v-list-item>
      
      <!-- 管理列表 -->
      <v-list-item 
        :active="isRouteActive('/manage/list')"
        router
        to="/manage/list"
        class="mb-1"
      >
        <v-list-item-icon>
          <v-icon>mdi-list</v-icon>
        </v-list-item-icon>
        <v-list-item-title>管理列表</v-list-item-title>
      </v-list-item>
      
      <!-- 分组标题 -->
      <v-list-subheader class="mt-4">更新日志</v-list-subheader>
      
      <!-- 时间线 -->
      <v-list-item 
        :active="isRouteActive('/timeline')"
        router
        to="/timeline"
        class="mb-1"
      >
        <v-list-item-icon>
          <v-icon>mdi-update</v-icon>
        </v-list-item-icon>
        <v-list-item-title>时间线</v-list-item-title>
      </v-list-item>
      
      <!-- 其他项 -->
      <v-list-item class="mb-1">
        <v-list-item-icon>
          <v-icon>mdi-alert</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Spam</v-list-item-title>
      </v-list-item>
    </v-list>
    
    <!-- 版权信息 -->
    <div class="pa-4 text-center text-caption text-secondary" style="position: absolute; bottom: 0; width: 100%;">
      <p>© 2023 繁墨 | Vuetify</p>
      <p>Powered by Vuetify & 繁墨</p>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'

// 接收父组件传递的侧边栏状态（保持不变）
const props = defineProps({
  drawer: {
    type: Boolean,
    default: false
  }
})

// 向父组件传递状态变化（保持不变）
const emit = defineEmits(['update:drawer'])

// 路由相关（保持不变）
const route = useRoute()

// 检测当前路由是否激活
const isRouteActive = (path) => {
  return route.path === path
}

// 响应式检测是否为移动设备（保持不变）
const isMobile = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 600
}

// 初始化和监听窗口大小变化（保持不变）
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
</script>
    