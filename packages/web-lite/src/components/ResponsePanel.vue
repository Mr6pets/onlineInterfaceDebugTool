<template>
  <el-card class="response-panel">
    <template #header>
      <div class="panel-header">
        <span>响应结果</span>
        <div class="response-info" v-if="response">
          <el-tag :type="getStatusType(response.status)">{{ response.status }}</el-tag>
          <span class="duration">{{ response.duration }}ms</span>
          <span class="size">{{ formatSize(response.size) }}</span>
        </div>
      </div>
    </template>
    
    <div class="response-content" v-if="response">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="响应体" name="body">
          <div class="response-body">
            <pre>{{ formatResponseData(response.data) }}</pre>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="响应头" name="headers">
          <div class="response-headers">
            <div 
              v-for="(value, key) in response.headers" 
              :key="key"
              class="header-item"
            >
              <strong>{{ key }}:</strong> {{ value }}
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <div class="empty-state" v-else>
      <el-empty description="暂无响应数据" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRequestStore } from '../stores/request'

const requestStore = useRequestStore()
const activeTab = ref('body')

const response = computed(() => requestStore.response)

const getStatusType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatResponseData = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}
</script>

<style lang="scss" scoped>
.response-panel {
  height: 100%;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    
    .response-info {
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: 12px;
      
      .duration, .size {
        color: #909399;
      }
    }
  }
  
  .response-content {
    height: calc(100% - 60px);
    
    .response-body {
      height: 400px;
      overflow: auto;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      
      pre {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
    
    .response-headers {
      .header-item {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 13px;
        
        strong {
          color: #409eff;
          margin-right: 8px;
        }
      }
    }
  }
  
  .empty-state {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>