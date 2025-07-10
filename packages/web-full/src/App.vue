<template>
  <div id="app">
    <el-container class="app-container">
      <el-aside class="app-sidebar" :width="sidebarWidth">
        <Sidebar />
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
import { ref } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'

const sidebarWidth = ref('280px')
</script>

<style lang="scss">
#app {
  height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  height: 100%;
}

.app-sidebar {
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.app-main {
  padding: 0;
  background: #f5f7fa;
}
</style>