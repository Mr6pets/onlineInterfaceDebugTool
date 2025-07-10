<template>
  <div class="history-page">
    <div class="page-header">
      <h1>请求历史</h1>
      <div class="header-actions">
        <el-button @click="clearHistory" type="danger" plain>
          <el-icon><Delete /></el-icon>
          清空历史
        </el-button>
        <el-button @click="exportHistory">
          <el-icon><Download /></el-icon>
          导出历史
        </el-button>
      </div>
    </div>

    <div class="history-filters">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-select v-model="filters.method" placeholder="请求方法" clearable>
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.status" placeholder="状态码" clearable>
            <el-option label="2xx 成功" value="2xx" />
            <el-option label="4xx 客户端错误" value="4xx" />
            <el-option label="5xx 服务器错误" value="5xx" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-input 
            v-model="filters.url" 
            placeholder="搜索URL" 
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-date-picker
            v-model="filters.date"
            type="date"
            placeholder="选择日期"
            clearable
          />
        </el-col>
      </el-row>
    </div>

    <div class="history-list">
      <el-table 
        :data="filteredHistory" 
        v-loading="loading"
        @row-click="viewDetails"
        style="width: 100%"
      >
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="getMethodTagType(row.method)"
              size="small"
            >
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="url" label="URL" min-width="300">
          <template #default="{ row }">
            <div class="url-cell">
              <span class="url-text">{{ row.url }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            {{ row.duration }}ms
          </template>
        </el-table-column>
        
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              size="small" 
              @click.stop="repeatRequest(row)"
            >
              重新发送
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog 
      v-model="detailVisible" 
      title="请求详情" 
      width="80%"
      top="5vh"
    >
      <div v-if="selectedRequest" class="request-details">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="请求信息" name="request">
            <div class="detail-section">
              <h4>基本信息</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="请求方法">{{ selectedRequest.method }}</el-descriptions-item>
                <el-descriptions-item label="请求URL">{{ selectedRequest.url }}</el-descriptions-item>
                <el-descriptions-item label="状态码">{{ selectedRequest.status }}</el-descriptions-item>
                <el-descriptions-item label="耗时">{{ selectedRequest.duration }}ms</el-descriptions-item>
              </el-descriptions>
            </div>
            
            <div class="detail-section">
              <h4>请求头</h4>
              <el-table :data="selectedRequest.requestHeaders" size="small">
                <el-table-column prop="key" label="键" width="200" />
                <el-table-column prop="value" label="值" />
              </el-table>
            </div>
            
            <div class="detail-section" v-if="selectedRequest.requestBody">
              <h4>请求体</h4>
              <el-input 
                v-model="selectedRequest.requestBody" 
                type="textarea" 
                :rows="6" 
                readonly
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="响应信息" name="response">
            <div class="detail-section">
              <h4>响应头</h4>
              <el-table :data="selectedRequest.responseHeaders" size="small">
                <el-table-column prop="key" label="键" width="200" />
                <el-table-column prop="value" label="值" />
              </el-table>
            </div>
            
            <div class="detail-section">
              <h4>响应体</h4>
              <el-input 
                v-model="selectedRequest.responseBody" 
                type="textarea" 
                :rows="10" 
                readonly
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Delete, 
  Download, 
  Search 
} from '@element-plus/icons-vue'

interface HistoryItem {
  id: string
  method: string
  url: string
  status: number
  duration: number
  timestamp: number
  requestHeaders: Array<{ key: string; value: string }>
  requestBody?: string
  responseHeaders: Array<{ key: string; value: string }>
  responseBody: string
}

const loading = ref(false)
const history = ref<HistoryItem[]>([])
const detailVisible = ref(false)
const selectedRequest = ref<HistoryItem | null>(null)
const activeTab = ref('request')

const filters = ref({
  method: '',
  status: '',
  url: '',
  date: null
})

const filteredHistory = computed(() => {
  let result = history.value
  
  if (filters.value.method) {
    result = result.filter(item => item.method === filters.value.method)
  }
  
  if (filters.value.status) {
    const statusPrefix = filters.value.status.charAt(0)
    result = result.filter(item => 
      item.status.toString().startsWith(statusPrefix)
    )
  }
  
  if (filters.value.url) {
    result = result.filter(item => 
      item.url.toLowerCase().includes(filters.value.url.toLowerCase())
    )
  }
  
  if (filters.value.date) {
    const filterDate = new Date(filters.value.date).toDateString()
    result = result.filter(item => 
      new Date(item.timestamp).toDateString() === filterDate
    )
  }
  
  return result
})

const getMethodTagType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info'
  }
  return types[method] || 'info'
}

const getStatusTagType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const viewDetails = (row: HistoryItem) => {
  selectedRequest.value = row
  detailVisible.value = true
  activeTab.value = 'request'
}

const repeatRequest = (item: HistoryItem) => {
  ElMessage.success('重新发送请求功能待实现')
  console.log('Repeat request:', item)
}

const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    history.value = []
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消
  }
}

const exportHistory = () => {
  const data = JSON.stringify(history.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `api-history-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('历史记录已导出')
}

const loadHistory = () => {
  loading.value = true
  
  // 模拟加载历史数据
  setTimeout(() => {
    history.value = [
      {
        id: '1',
        method: 'GET',
        url: 'https://api.example.com/users',
        status: 200,
        duration: 245,
        timestamp: Date.now() - 3600000,
        requestHeaders: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer token...' }
        ],
        responseHeaders: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Content-Length', value: '1234' }
        ],
        responseBody: JSON.stringify({ users: [] }, null, 2)
      },
      {
        id: '2',
        method: 'POST',
        url: 'https://api.example.com/users',
        status: 201,
        duration: 567,
        timestamp: Date.now() - 7200000,
        requestHeaders: [
          { key: 'Content-Type', value: 'application/json' }
        ],
        requestBody: JSON.stringify({ name: 'John', email: 'john@example.com' }, null, 2),
        responseHeaders: [
          { key: 'Content-Type', value: 'application/json' }
        ],
        responseBody: JSON.stringify({ id: 1, name: 'John', email: 'john@example.com' }, null, 2)
      }
    ]
    loading.value = false
  }, 1000)
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.history-filters {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.url-cell {
  display: flex;
  align-items: center;
}

.url-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-details {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>