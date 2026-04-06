<template>
  <v-app-bar 
    color="primary" 
    fixed 
    app
    dark
  >
    <!-- 侧边栏切换按钮 -->
    <v-btn 
      icon 
      @click="$emit('toggle-sidebar')"
      class="mr-2"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>
    
    <!-- 应用标题 -->
    <v-toolbar-title>B站视频解析下载</v-toolbar-title>
    
    <!-- 填充空间，将右侧内容推到右边 -->
    <v-spacer></v-spacer>
    
    <!-- 右侧操作按钮 -->
    <v-btn icon>
      <v-icon>mdi-settings</v-icon>
    </v-btn>
    <v-btn icon>
      <v-icon>mdi-exit-to-app</v-icon>
    </v-btn>
    <v-btn icon>
      <v-icon>mdi-dots-vertical</v-icon>
    </v-btn>
    
    <!-- 用户信息区域 -->
    <div class="usertitle" style="display: none; margin-left: 16px;">
      <img 
        id="ufacemin" 
        src="" 
        height="20px" 
        style="border-radius: 50%; margin-right: 5px;"
        alt="用户头像"
      >
      <span id="unamemin"></span>
    </div>
  </v-app-bar>
</template>

<script setup>
// 无需额外逻辑，通过事件传递控制侧边栏
</script>
    