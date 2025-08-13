<template>
  <el-dialog
    v-model="visible"
    title="请求详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="request" class="request-detail">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h4>基本信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">请求方法:</span>
            <el-tag :type="getMethodTagType(request.method)" size="small">
              {{ request.method }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">状态码:</span>
            <el-tag :type="getStatusTagType(request.status)" size="small">
              {{ request.status }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">响应时间:</span>
            <span :class="getDurationClass(request.duration)">
              {{ request.duration }}ms
            </span>
          </div>
          <div class="info-item">
            <span class="label">响应大小:</span>
            <span>{{ formatSize(request.size) }}</span>
          </div>
          <div class="info-item">
            <span class="label">请求时间:</span>
            <span>{{ formatDateTime(request.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- URL 信息 -->
      <div class="detail-section">
        <h4>URL 信息</h4>
        <div class="url-info">
          <div class="url-text">{{ request.url }}</div>
          <el-button size="small" @click="copyUrl">
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
        </div>
      </div>

      <!-- 性能分析 -->
      <div class="detail-section">
        <h4>性能分析</h4>
        <div class="performance-chart">
          <div class="timing-bar">
            <div class="timing-item dns" :style="{ width: timingPercentages.dns + '%' }">
              <span>DNS ({{ timingData.dns }}ms)</span>
            </div>
            <div class="timing-item connect" :style="{ width: timingPercentages.connect + '%' }">
              <span>连接 ({{ timingData.connect }}ms)</span>
            </div>
            <div class="timing-item request" :style="{ width: timingPercentages.request + '%' }">
              <span>请求 ({{ timingData.request }}ms)</span>
            </div>
            <div class="timing-item response" :style="{ width: timingPercentages.response + '%' }">
              <span>响应 ({{ timingData.response }}ms)</span>
            </div>
          </div>
          <div class="timing-legend">
            <div class="legend-item">
              <span class="legend-color dns"></span>
              <span>DNS解析: {{ timingData.dns }}ms</span>
            </div>
            <div class="legend-item">
              <span class="legend-color connect"></span>
              <span>连接建立: {{ timingData.connect }}ms</span>
            </div>
            <div class="legend-item">
              <span class="legend-color request"></span>
              <span>请求发送: {{ timingData.request }}ms</span>
            </div>
            <div class="legend-item">
              <span class="legend-color response"></span>
              <span>响应接收: {{ timingData.response }}ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 请求头 -->
      <div class="detail-section">
        <h4>请求头</h4>
        <div class="headers-container">
          <div v-for="(value, key) in requestHeaders" :key="key" class="header-item">
            <span class="header-key">{{ key }}:</span>
            <span class="header-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- 响应头 -->
      <div class="detail-section">
        <h4>响应头</h4>
        <div class="headers-container">
          <div v-for="(value, key) in responseHeaders" :key="key" class="header-item">
            <span class="header-key">{{ key }}:</span>
            <span class="header-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- 用户代理 -->
      <div class="detail-section">
        <h4>用户代理</h4>
        <div class="user-agent">
          {{ request.userAgent }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="replayRequest">
          <el-icon><Refresh /></el-icon>
          重放请求
        </el-button>
        <el-button @click="exportDetail">
          <el-icon><Download /></el-icon>
          导出详情
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Refresh, Download } from '@element-plus/icons-vue'
import type { ExtendedPerformanceMetrics } from '@/types'

interface Props {
  modelValue: boolean
  request: ExtendedPerformanceMetrics | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 模拟时序数据
const timingData = computed(() => {
  if (!props.request) return { dns: 0, connect: 0, request: 0, response: 0 }
  
  const total = props.request.duration
  return {
    dns: Math.round(total * 0.1),
    connect: Math.round(total * 0.2),
    request: Math.round(total * 0.3),
    response: Math.round(total * 0.4)
  }
})

const timingPercentages = computed(() => {
  const total = Object.values(timingData.value).reduce((sum, val) => sum + val, 0)
  if (total === 0) return { dns: 0, connect: 0, request: 0, response: 0 }
  
  return {
    dns: (timingData.value.dns / total) * 100,
    connect: (timingData.value.connect / total) * 100,
    request: (timingData.value.request / total) * 100,
    response: (timingData.value.response / total) * 100
  }
})

// 模拟请求头和响应头
const requestHeaders = computed(() => {
  if (!props.request) return {}
  
  return {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'User-Agent': props.request.userAgent
  }
})

const responseHeaders = computed(() => {
  if (!props.request) return {}
  
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': props.request.size.toString(),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Server': 'nginx/1.18.0',
    'X-Response-Time': `${props.request.duration}ms`
  }
})

// 方法
const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
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

const copyUrl = async () => {
  if (!props.request) return
  
  try {
    await navigator.clipboard.writeText(props.request.url)
    ElMessage.success('URL已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const replayRequest = () => {
  if (!props.request) return
  
  ElMessage.info(`重放请求: ${props.request.method} ${props.request.url}`)
  // 实现重放逻辑
}

const exportDetail = () => {
  if (!props.request) return
  
  const data = {
    request: props.request,
    timing: timingData.value,
    requestHeaders: requestHeaders.value,
    responseHeaders: responseHeaders.value,
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `request-detail-${props.request.id}.json`
  a.click()
  
  URL.revokeObjectURL(url)
  ElMessage.success('详情导出成功')
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.request-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.url-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.url-text {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  word-break: break-all;
}

.performance-chart {
  margin-top: 12px;
}

.timing-bar {
  display: flex;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.timing-item {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 500;
  position: relative;
  min-width: 60px;
}

.timing-item span {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.timing-item.dns {
  background-color: #409eff;
}

.timing-item.connect {
  background-color: #67c23a;
}

.timing-item.request {
  background-color: #e6a23c;
}

.timing-item.response {
  background-color: #f56c6c;
}

.timing-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.dns {
  background-color: #409eff;
}

.legend-color.connect {
  background-color: #67c23a;
}

.legend-color.request {
  background-color: #e6a23c;
}

.legend-color.response {
  background-color: #f56c6c;
}

.headers-container {
  max-height: 200px;
  overflow-y: auto;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
}

.header-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.header-key {
  font-weight: 600;
  color: #409eff;
  min-width: 150px;
  flex-shrink: 0;
}

.header-value {
  color: #606266;
  word-break: break-all;
}

.user-agent {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
  line-height: 1.5;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>