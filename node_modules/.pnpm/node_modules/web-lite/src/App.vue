<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><Connection /></el-icon>
            接口调试工具 Lite
          </h1>
          <div class="header-actions">
            <el-button type="primary" @click="clearAll">清空</el-button>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <RequestPanel />
        <ResponsePanel />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { Connection } from '@element-plus/icons-vue'
import RequestPanel from './components/RequestPanel.vue'
import ResponsePanel from './components/ResponsePanel.vue'
import { useRequestStore } from './stores/request'

const requestStore = useRequestStore()

const clearAll = () => {
  requestStore.clearRequest()
  requestStore.clearResponse()
}
</script>

<style lang="scss">
#app {
  height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  height: 100%;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
  }
  
  .app-title {
    margin: 0;
    color: #409eff;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
  }
}

.app-main {
  padding: 20px;
  background: #f5f7fa;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: calc(100vh - 60px);
}

@media (max-width: 768px) {
  .app-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}
</style>