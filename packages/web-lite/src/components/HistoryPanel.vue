<template>
  <el-drawer
    v-model="visible"
    title="请求历史"
    direction="rtl"
    size="400px"
  >
    <div class="history-panel">
      <div class="history-toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索历史记录"
          :prefix-icon="Search"
          clearable
          size="small"
        />
        <el-button 
          @click="clearHistory" 
          type="danger" 
          size="small"
          :icon="Delete"
        >
          清空历史
        </el-button>
      </div>
      
      <div class="history-list">
        <div 
          v-for="(item, index) in filteredHistory" 
          :key="index"
          class="history-item"
          @click="loadRequest(item.request)"
        >
          <div class="request-info">
            <el-tag 
              :type="getMethodType(item.request.method)" 
              size="small"
            >
              {{ item.request.method }}
            </el-tag>
            <span class="url">{{ item.request.url }}</span>
          </div>
          
          <div class="response-info" v-if="item.response">
            <el-tag 
              :type="getStatusType(item.response.status)" 
              size="small"
            >
              {{ item.response.status }}
            </el-tag>
            <span class="duration">{{ item.response.duration }}ms</span>
          </div>
          
          <div class="timestamp">
            {{ formatTime(item.timestamp) }}
          </div>
          
          <div class="actions">
            <el-button 
              size="small" 
              text 
              @click.stop="duplicateRequest(item.request)"
              :icon="CopyDocument"
            />
            <el-button 
              size="small" 
              text 
              type="danger"
              @click.stop="removeHistoryItem(index)"
              :icon="Delete"
            />
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, CopyDocument } from '@element-plus/icons-vue'
import { useRequestStore } from '../stores/request'
import type { RequestConfig } from '@api-debug-tool/shared/types'
import dayjs from 'dayjs'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'load-request': [request: RequestConfig]
}>()

const requestStore = useRequestStore()
const searchText = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredHistory = computed(() => {
  if (!searchText.value) return requestStore.history
  
  return requestStore.history.filter(item => 
    item.request.url.toLowerCase().includes(searchText.value.toLowerCase()) ||
    item.request.method.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const getMethodType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info'
  }
  return types[method] || 'info'
}

const getStatusType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const formatTime = (timestamp: Date) => {
  return dayjs(timestamp).format('MM-DD HH:mm:ss')
}

const loadRequest = (request: RequestConfig) => {
  emit('load-request', request)
  visible.value = false
  ElMessage.success('请求已加载')
}

const duplicateRequest = (request: RequestConfig) => {
  emit('load-request', { ...request })
  ElMessage.success('请求已复制')
}

const removeHistoryItem = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条历史记录吗？', '确认删除', {
      type: 'warning'
    })
    
    requestStore.history.splice(index, 1)
    ElMessage.success('历史记录已删除')
  } catch {
    // 用户取消
  }
}

const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有历史记录吗？', '确认清空', {
      type: 'warning'
    })
    
    requestStore.clearHistory()
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .history-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    
    .el-input {
      flex: 1;
    }
  }
  
  .history-list {
    flex: 1;
    overflow: auto;
    
    .history-item {
      padding: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
      }
      
      .request-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        
        .url {
          flex: 1;
          font-size: 12px;
          color: #606266;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      
      .response-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        
        .duration {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .timestamp {
        font-size: 11px;
        color: #c0c4cc;
        margin-bottom: 8px;
      }
      
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
      }
    }
  }
}
</style>