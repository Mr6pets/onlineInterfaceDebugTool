<template>
  <div class="performance-table">
    <div class="table-header">
      <div class="table-filters">
        <el-input
          v-model="searchText"
          placeholder="搜索URL或方法"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" clearable>
          <el-option label="成功" value="success" />
          <el-option label="客户端错误" value="4xx" />
          <el-option label="服务器错误" value="5xx" />
        </el-select>
        
        <el-select v-model="methodFilter" placeholder="方法筛选" style="width: 100px" clearable>
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
        </el-select>
      </div>
      
      <div class="table-actions">
        <el-button @click="exportData" size="small">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="refreshData" :loading="loading" size="small">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-table
      :data="paginatedData"
      v-loading="loading"
      @row-click="handleRowClick"
      stripe
      style="width: 100%"
      :default-sort="{ prop: 'timestamp', order: 'descending' }"
    >
      <el-table-column prop="timestamp" label="时间" width="160" sortable>
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="method" label="方法" width="80" sortable>
        <template #default="{ row }">
          <el-tag :type="getMethodTagType(row.method)" size="small">
            {{ row.method }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="url" label="URL" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="url-text">{{ row.url }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="状态" width="80" sortable>
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="duration" label="响应时间" width="100" sortable>
        <template #default="{ row }">
          <span :class="getDurationClass(row.duration)">
            {{ row.duration }}ms
          </span>
        </template>
      </el-table-column>
      
      <el-table-column prop="size" label="大小" width="100" sortable>
        <template #default="{ row }">
          {{ formatSize(row.size) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            text
            @click.stop="viewDetails(row)"
          >
            详情
          </el-button>
          <el-button
            type="warning"
            size="small"
            text
            @click.stop="replayRequest(row)"
          >
            重放
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="filteredData.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, Refresh } from '@element-plus/icons-vue'
import type { ExtendedPerformanceMetrics } from '@/types'

interface Props {
  data: ExtendedPerformanceMetrics[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'row-click': [row: ExtendedPerformanceMetrics]
  'refresh': []
}>()

// 筛选和搜索
const searchText = ref('')
const statusFilter = ref('')
const methodFilter = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const filteredData = computed(() => {
  let result = props.data
  
  // 搜索筛选
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(item => 
      item.url.toLowerCase().includes(search) ||
      item.method.toLowerCase().includes(search)
    )
  }
  
  // 状态筛选
  if (statusFilter.value) {
    switch (statusFilter.value) {
      case 'success':
        result = result.filter(item => item.status >= 200 && item.status < 400)
        break
      case '4xx':
        result = result.filter(item => item.status >= 400 && item.status < 500)
        break
      case '5xx':
        result = result.filter(item => item.status >= 500)
        break
    }
  }
  
  // 方法筛选
  if (methodFilter.value) {
    result = result.filter(item => item.method === methodFilter.value)
  }
  
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

// 方法
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const formatSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(1) + ' MB'
  } else if (size >= 1024) {
    return (size / 1024).toFixed(1) + ' KB'
  } else {
    return size + ' B'
  }
}

const getMethodTagType = (method: string) => {
  switch (method) {
    case 'GET': return 'success'
    case 'POST': return 'primary'
    case 'PUT': return 'warning'
    case 'DELETE': return 'danger'
    default: return 'info'
  }
}

const getStatusTagType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const getDurationClass = (duration: number) => {
  if (duration > 2000) return 'duration-slow'
  if (duration > 1000) return 'duration-medium'
  return 'duration-fast'
}

const handleRowClick = (row: ExtendedPerformanceMetrics) => {
  emit('row-click', row)
}

const viewDetails = (row: ExtendedPerformanceMetrics) => {
  emit('row-click', row)
}

const replayRequest = (row: ExtendedPerformanceMetrics) => {
  ElMessage.info(`重放请求: ${row.method} ${row.url}`)
  // 实现重放逻辑
}

const exportData = () => {
  const data = JSON.stringify(filteredData.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-data-${Date.now()}.json`
  a.click()
  
  URL.revokeObjectURL(url)
  ElMessage.success('数据导出成功')
}

const refreshData = () => {
  emit('refresh')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
</script>

<style scoped>
.performance-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.table-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.url-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.duration-fast {
  color: #67c23a;
  font-weight: 500;
}

.duration-medium {
  color: #e6a23c;
  font-weight: 500;
}

.duration-slow {
  color: #f56c6c;
  font-weight: 500;
}

.table-pagination {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>