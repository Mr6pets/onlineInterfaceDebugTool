<template>
  <div id="app">
    <el-container class="app-container">
      <el-aside class="app-sidebar" :width="sidebarWidth">
        <Sidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
      </el-aside>
      
      <el-container>
        <el-header class="app-header">
          <AppHeader />
        </el-header>
        
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'

const sidebarCollapsed = ref(false)
const sidebarWidth = computed(() => sidebarCollapsed.value ? '64px' : '280px')

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style lang="scss">
#app {
  height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f0f9ff 100%);
  overflow: hidden;
}

.app-container {
  height: 100%;
  position: relative;
}

.app-sidebar {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-right: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.app-header {
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 0 0 16px 16px;
  margin: 0 8px;
  padding: 0;
  height: auto !important;
  position: relative;
  z-index: 1000;
}

.app-main {
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px) saturate(150%);
  border-radius: 16px;
  margin: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow-y: auto;
  height: calc(100vh - 128px);
  min-height: 600px;
}

.app-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}
</style>