<template>
  <el-dialog
    v-model="visible"
    :title="`测试详情 - ${testResult?.testId || 'N/A'}`"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="testResult" class="test-details">
      <!-- 基本信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-tag :type="getStatusType(testResult.status)" size="small">
              {{ getStatusText(testResult.status) }}
            </el-tag>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="测试ID">
            {{ testResult.testId }}
          </el-descriptions-item>
          <el-descriptions-item label="测试名称">
            {{ testResult.testName || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="执行时间">
            {{ formatTime(testResult.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="耗时">
            {{ testResult.duration || 0 }}ms
          </el-descriptions-item>
          <el-descriptions-item label="环境">
            {{ testResult.environment || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="执行者">
            {{ testResult.executor || 'System' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 请求信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <span>请求信息</span>
        </template>
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="请求方法">
            <el-tag size="small" :type="getMethodType(testResult.request?.method)">
              {{ testResult.request?.method || 'N/A' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求URL">
            <el-text class="url-text">{{ testResult.request?.url || 'N/A' }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="请求头" v-if="testResult.request?.headers">
            <div class="json-viewer">
              <pre>{{ JSON.stringify(testResult.request.headers, null, 2) }}</pre>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="请求体" v-if="testResult.request?.body">
            <div class="json-viewer">
              <pre>{{ formatRequestBody(testResult.request.body) }}</pre>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 响应信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>响应信息</span>
            <el-tag 
              size="small" 
              :type="(testResult.response?.status && testResult.response.status >= 200 && testResult.response.status < 300) ? 'success' : 'danger'"
            >
              {{ testResult.response?.status || 'N/A' }}
            </el-tag>
          </div>
        </template>
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="状态码">
            <el-tag 
              :type="(testResult.response?.status && testResult.response.status >= 200 && testResult.response.status < 300) ? 'success' : 'danger'"
            >
              {{ testResult.response?.status || 'N/A' }}
            </el-tag>
            <span style="margin-left: 8px;">{{ getStatusText(testResult.response?.status || 0) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="响应时间">
            {{ testResult.response?.time || 0 }}ms
          </el-descriptions-item>
          <el-descriptions-item label="响应大小">
            {{ formatBytes(testResult.response?.size || 0) }}
          </el-descriptions-item>
          <el-descriptions-item label="响应头" v-if="testResult.response?.headers">
            <div class="json-viewer">
              <pre>{{ JSON.stringify(testResult.response.headers, null, 2) }}</pre>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="响应体" v-if="testResult.response?.body">
            <div class="json-viewer">
              <pre>{{ formatResponseBody(testResult.response.body) }}</pre>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 断言结果 -->
      <el-card class="detail-card" shadow="never" v-if="testResult.assertions && testResult.assertions.length > 0">
        <template #header>
          <div class="card-header">
            <span>断言结果</span>
            <el-tag size="small" :type="getAssertionSummaryType()">
              {{ getPassedAssertions() }}/{{ testResult.assertions.length }} 通过
            </el-tag>
          </div>
        </template>
        
        <div class="assertions-list">
          <div 
            v-for="(assertion, index) in testResult.assertions" 
            :key="index" 
            class="assertion-item"
            :class="{ 'assertion-failed': !assertion.passed }"
          >
            <div class="assertion-header">
              <el-icon :color="assertion.passed ? '#67c23a' : '#f56c6c'">
                <Check v-if="assertion.passed" />
                <Close v-else />
              </el-icon>
              <span class="assertion-name">{{ assertion.name }}</span>
              <el-tag size="small" :type="assertion.passed ? 'success' : 'danger'">
                {{ assertion.passed ? '通过' : '失败' }}
              </el-tag>
            </div>
            <div class="assertion-details">
              <p><strong>预期:</strong> {{ assertion.expected }}</p>
              <p><strong>实际:</strong> {{ assertion.actual }}</p>
              <p v-if="assertion.message"><strong>消息:</strong> {{ assertion.message }}</p>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 错误信息 -->
      <el-card class="detail-card" shadow="never" v-if="testResult.error">
        <template #header>
          <span>错误信息</span>
        </template>
        
        <el-alert
          :title="testResult.error"
          type="error"
          :closable="false"
          show-icon
        >
          <div v-if="testResult.stackTrace" class="stack-trace">
            <pre>{{ testResult.stackTrace }}</pre>
          </div>
        </el-alert>
      </el-card>
      
      <!-- 日志信息 -->
      <el-card class="detail-card" shadow="never" v-if="testResult.logs && testResult.logs.length > 0">
        <template #header>
          <span>执行日志</span>
        </template>
        
        <div class="logs-container">
          <div 
            v-for="(log, index) in testResult.logs" 
            :key="index" 
            class="log-item"
            :class="`log-${log.level}`"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <el-tag size="small" :type="getLogLevelType(log.level)">{{ log.level.toUpperCase() }}</el-tag>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <div v-else class="no-data">
      <el-empty description="暂无测试详情" />
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="exportDetails">
          导出详情
        </el-button>
        <el-button v-if="testResult" @click="rerunTest">
          重新运行
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { TestResult } from '@/types'

interface Props {
  modelValue: boolean
  testResult?: TestResult | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'rerun-test': [testResult: TestResult]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'passed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'skipped':
      return 'warning'
    case 'running':
      return 'primary'
    default:
      return 'info'
  }
}

const getStatusText = (status: string | number | undefined) => {
  if (typeof status === 'number') {
    // HTTP状态码
    if (status >= 200 && status < 300) return 'OK'
    if (status >= 300 && status < 400) return 'Redirect'
    if (status >= 400 && status < 500) return 'Client Error'
    if (status >= 500) return 'Server Error'
    return 'Unknown'
  }
  
  if (typeof status === 'string') {
    // 测试状态
    switch (status) {
      case 'passed':
        return '通过'
      case 'failed':
        return '失败'
      case 'skipped':
        return '跳过'
      case 'running':
        return '运行中'
      default:
        return '未知'
    }
  }
  
  return '未知'
}

const getMethodType = (method: string | undefined) => {
  if (!method) return 'info'
  
  switch (method.toUpperCase()) {
    case 'GET':
      return 'success'
    case 'POST':
      return 'primary'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'danger'
    default:
      return 'info'
  }
}

const getLogLevelType = (level: string) => {
  switch (level.toLowerCase()) {
    case 'error':
      return 'danger'
    case 'warn':
      return 'warning'
    case 'info':
      return 'primary'
    case 'debug':
      return 'info'
    default:
      return 'info'
  }
}

const getPassedAssertions = () => {
  if (!props.testResult?.assertions) return 0
  return props.testResult.assertions.filter(assertion => assertion.passed).length
}

const getAssertionSummaryType = () => {
  if (!props.testResult?.assertions) return 'info'
  const passed = getPassedAssertions()
  const total = props.testResult.assertions.length
  return passed === total ? 'success' : 'danger'
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatRequestBody = (body: any) => {
  if (typeof body === 'string') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }
  return JSON.stringify(body, null, 2)
}

const formatResponseBody = (body: any) => {
  if (typeof body === 'string') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }
  return JSON.stringify(body, null, 2)
}

const exportDetails = () => {
  if (!props.testResult) return
  
  const data = {
    testId: props.testResult.testId,
    status: props.testResult.status,
    timestamp: props.testResult.timestamp,
    duration: props.testResult.duration,
    request: props.testResult.request,
    response: props.testResult.response,
    assertions: props.testResult.assertions,
    error: props.testResult.error,
    logs: props.testResult.logs
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `test-details-${props.testResult.testId}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('测试详情已导出')
}

const rerunTest = () => {
  if (props.testResult) {
    emit('rerun-test', props.testResult)
    ElMessage.info('重新运行测试...')
  }
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.test-details {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 16px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.url-text {
  word-break: break-all;
  font-family: monospace;
}

.json-viewer {
  max-height: 200px;
  overflow-y: auto;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 8px;
}

.json-viewer pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #606266;
}

.assertions-list {
  space-y: 12px;
}

.assertion-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.assertion-item.assertion-failed {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.assertion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.assertion-name {
  font-weight: 500;
  flex: 1;
}

.assertion-details p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}

.stack-trace pre {
  margin: 8px 0 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #f56c6c;
  background: #fef0f0;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  font-family: monospace;
}

.log-time {
  color: #909399;
  min-width: 120px;
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.log-error {
  background-color: #fef0f0;
}

.log-warn {
  background-color: #fdf6ec;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>