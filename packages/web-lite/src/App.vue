<template>
  <div id="app" :class="{ 'dark': settingsStore.settings?.theme === 'dark' }">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from './stores/settings'

const settingsStore = useSettingsStore()

// 应用设置
onMounted(() => {
  settingsStore.applyCSSVariables()
})
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f7fa;
}

#app {
  height: 100vh;
  overflow: hidden;
  
  &.dark {
    color: #e5eaf3;
    background-color: #0d1117;
    
    body {
      background-color: #0d1117;
    }
  }
}

// 全局滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  
  &:hover {
    background: #a8a8a8;
  }
}

.dark {
  ::-webkit-scrollbar-track {
    background: #2d333b;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #545d68;
    
    &:hover {
      background: #636e7b;
    }
  }
}

// 动画效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

// 响应式工具类
.hidden-mobile {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hidden-desktop {
  @media (min-width: 769px) {
    display: none !important;
  }
}
</style>