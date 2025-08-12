<template>
  <div class="response-panel">
    <!-- 响应状态栏 -->
    <div class="response-status" v-if="requestStore.response">
      <div class="status-info">
        <div class="status-code" :class="getStatusClass(requestStore.response.status)">
          {{ requestStore.response.status }} {{ requestStore.response.statusText }}
        </div>
        <div class="response-meta">
          <span class="meta-item">
            <el-icon><Timer /></el-icon>
            {{ requestStore.response.duration }}ms
          </span>
          <span class="meta-item">
            <el-icon><Document /></el-icon>
            {{ formatSize(requestStore.response.size) }}
          </span>
        </div>
      </div>
      
      <div class="status-actions">
        <el-button
          type="text"
          size="small"
          @click="copyResponse"
        >
          <el-icon><CopyDocument /></el-icon>
          复制响应
        </el-button>
        <el-button
          type="text"
          size="small"
          @click="downloadResponse"
        >
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </div>
    </div>
    
    <!-- 响应内容 -->
    <div class="response-content">
      <!-- 无响应状态 -->
      <div v-if="!requestStore.response" class="no-response">
        <div class="no-response-icon">
          <el-icon><Position /></el-icon>
        </div>
        <h3>发送请求查看响应</h3>
        <p>点击发送按钮开始调试API接口</p>
      </div>
      
      <!-- 加载状态 -->
      <div v-else-if="requestStore.loading" class="loading-state">
        <el-loading-spinner />
        <p>正在发送请求...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="requestStore.error" class="error-state">
        <div class="error-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <h3>请求失败</h3>
        <p class="error-message">{{ requestStore.error }}</p>
        <el-button type="primary" @click="requestStore.clearResponse()">
          清除错误
        </el-button>
      </div>
      
      <!-- 响应数据 -->
      <div v-else class="response-data">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 响应体 -->
          <el-tab-pane label="响应体" name="body">
            <div class="tab-content">
              <div class="response-toolbar">
                <div class="toolbar-left">
                  <span class="content-type">{{ requestStore.response.headers['content-type'] || 'text/plain' }}</span>
                </div>
                <div class="toolbar-right">
                  <el-button-group>
                    <el-button
                      :type="viewMode === 'pretty' ? 'primary' : 'default'"
                      size="small"
                      @click="viewMode = 'pretty'"
                    >
                      格式化
                    </el-button>
                    <el-button
                      :type="viewMode === 'raw' ? 'primary' : 'default'"
                      size="small"
                      @click="viewMode = 'raw'"
                    >
                      原始
                    </el-button>
                    <el-button
                      :type="viewMode === 'preview' ? 'primary' : 'default'"
                      size="small"
                      @click="viewMode = 'preview'"
                      :disabled="!isHtmlContent"
                    >
                      预览
                    </el-button>
                  </el-button-group>
                </div>
              </div>
              
              <!-- 格式化视图 -->
              <div v-if="viewMode === 'pretty'" class="response-body pretty">
                <pre class="formatted-content">{{ formattedResponse }}</pre>
              </div>
              
              <!-- 原始视图 -->
              <div v-else-if="viewMode === 'raw'" class="response-body raw">
                <pre class="raw-content">{{ requestStore.response.data }}</pre>
              </div>
              
              <!-- HTML预览 -->
              <div v-else-if="viewMode === 'preview'" class="response-body preview">
                <iframe
                  :srcdoc="requestStore.response.data"
                  class="html-preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 响应头 -->
          <el-tab-pane label="响应头" name="headers">
            <div class="tab-content">
              <div class="headers-list">
                <div
                  v-for="(value, key) in requestStore.response.headers"
                  :key="key"
                  class="header-item"
                >
                  <div class="header-key">{{ key }}</div>
                  <div class="header-value">{{ value }}</div>
                </div>
                
                <div v-if="Object.keys(requestStore.response.headers).length === 0" class="empty-state">
                  无响应头信息
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- Cookies -->
          <el-tab-pane label="Cookies" name="cookies">
            <div class="tab-content">
              <div class="cookies-list">
                <div
                  v-for="(cookie, index) in requestStore.response?.cookies || []"
                  :key="index"
                  class="cookie-item"
                >
                  <div class="cookie-name">{{ cookie.name }}</div>
                  <div class="cookie-value">{{ cookie.value }}</div>
                  <div class="cookie-meta">
                    <span v-if="cookie.domain" class="cookie-domain">Domain: {{ cookie.domain }}</span>
                    <span v-if="cookie.path" class="cookie-path">Path: {{ cookie.path }}</span>
                    <span v-if="cookie.expires" class="cookie-expires">Expires: {{ cookie.expires }}</span>
                  </div>
                </div>
                
                <div v-if="(requestStore.response?.cookies || []).length === 0" class="empty-state">
                  无Cookie信息
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 测试结果 -->
          <el-tab-pane label="测试" name="tests">
            <div class="tab-content">
              <div class="tests-section">
                <div class="section-header">
                  <h4>响应断言</h4>
                  <el-button type="text" size="small" @click="addTest">
                    <el-icon><Plus /></el-icon>
                    添加测试
                  </el-button>
                </div>
                
                <div class="tests-list">
                  <div
                    v-for="(test, index) in tests"
                    :key="index"
                    class="test-item"
                    :class="{ passed: test.passed, failed: !test.passed && test.executed }"
                  >
                    <div class="test-config">
                      <el-select v-model="test.type" placeholder="测试类型" style="width: 150px;">
                        <el-option label="状态码" value="status" />
                        <el-option label="响应时间" value="time" />
                        <el-option label="响应体包含" value="body-contains" />
                        <el-option label="JSON路径" value="json-path" />
                      </el-select>
                      
                      <el-select v-model="test.operator" placeholder="操作符" style="width: 100px;">
                        <el-option label="等于" value="equals" />
                        <el-option label="不等于" value="not-equals" />
                        <el-option label="大于" value="greater" />
                        <el-option label="小于" value="less" />
                        <el-option label="包含" value="contains" />
                      </el-select>
                      
                      <el-input
                        v-model="test.expected"
                        placeholder="期望值"
                        style="flex: 1;"
                      />
                      
                      <el-button
                        type="text"
                        size="small"
                        @click="removeTest(index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    
                    <div v-if="test.executed" class="test-result">
                      <el-icon v-if="test.passed" class="test-icon passed"><SuccessFilled /></el-icon>
                      <el-icon v-else class="test-icon failed"><CircleCloseFilled /></el-icon>
                      <span class="test-message">{{ test.message }}</span>
                    </div>
                  </div>
                  
                  <div v-if="tests.length === 0" class="empty-state">
                    暂无测试用例
                  </div>
                </div>
                
                <div v-if="tests.length > 0" class="tests-actions">
                  <el-button type="primary" @click="runTests">
                    <el-icon><CaretRight /></el-icon>
                    运行测试
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Timer,
  Document,
  CopyDocument,
  Download,
  Position,
  WarningFilled,
  Plus,
  Delete,
  SuccessFilled,
  CircleCloseFilled,
  CaretRight
} from '@element-plus/icons-vue'
import { useRequestStore } from '@/stores/request'

const requestStore = useRequestStore()
const activeTab = ref('body')
const viewMode = ref('pretty')

// 测试用例
const tests = ref<Array<{
  type: string
  operator: string
  expected: string
  executed: boolean
  passed: boolean
  message: string
}>>([])

// 计算属性
const isHtmlContent = computed(() => {
  if (!requestStore.response) return false
  const contentType = requestStore.response.headers['content-type'] || ''
  return contentType.includes('text/html')
})

const formattedResponse = computed(() => {
  if (!requestStore.response?.data) return ''
  
  try {
    const contentType = requestStore.response.headers['content-type'] || ''
    
    if (contentType.includes('application/json')) {
      return JSON.stringify(JSON.parse(requestStore.response.data), null, 2)
    }
    
    return requestStore.response.data
  } catch {
    return requestStore.response.data
  }
})

// 获取状态码样式
const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400) return 'error'
  return 'info'
}

// 格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 复制响应
const copyResponse = async () => {
  if (!requestStore.response?.data) return
  
  try {
    await navigator.clipboard.writeText(requestStore.response.data)
    ElMessage.success('响应内容已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 下载响应
const downloadResponse = () => {
  if (!requestStore.response?.data) return
  
  const contentType = requestStore.response.headers['content-type'] || 'text/plain'
  let extension = '.txt'
  
  if (contentType.includes('application/json')) {
    extension = '.json'
  } else if (contentType.includes('text/html')) {
    extension = '.html'
  } else if (contentType.includes('text/xml')) {
    extension = '.xml'
  }
  
  const blob = new Blob([requestStore.response.data], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `response_${Date.now()}${extension}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('响应已下载')
}

// 测试管理
const addTest = () => {
  tests.value.push({
    type: 'status',
    operator: 'equals',
    expected: '200',
    executed: false,
    passed: false,
    message: ''
  })
}

const removeTest = (index: number) => {
  tests.value.splice(index, 1)
}

// 运行测试
const runTests = () => {
  if (!requestStore.response) {
    ElMessage.warning('请先发送请求')
    return
  }
  
  tests.value.forEach(test => {
    test.executed = true
    
    try {
      let actual: any
      
      switch (test.type) {
        case 'status':
          actual = requestStore.response!.status
          break
        case 'time':
          actual = requestStore.response!.duration
          break
        case 'body-contains':
          actual = requestStore.response!.data
          break
        case 'json-path':
          try {
            const data = JSON.parse(requestStore.response!.data)
            // 简单的JSON路径解析（支持点号分隔）
            actual = test.expected.split('.').reduce((obj, key) => obj?.[key], data)
          } catch {
            actual = undefined
          }
          break
        default:
          actual = undefined
      }
      
      const expected = test.type === 'time' || test.type === 'status' 
        ? Number(test.expected) 
        : test.expected
      
      let passed = false
      
      switch (test.operator) {
        case 'equals':
          passed = actual === expected
          break
        case 'not-equals':
          passed = actual !== expected
          break
        case 'greater':
          passed = Number(actual) > Number(expected)
          break
        case 'less':
          passed = Number(actual) < Number(expected)
          break
        case 'contains':
          passed = String(actual).includes(String(expected))
          break
      }
      
      test.passed = passed
      test.message = passed 
        ? `测试通过: ${actual} ${test.operator} ${expected}`
        : `测试失败: 期望 ${expected}, 实际 ${actual}`
        
    } catch (error) {
      test.passed = false
      test.message = `测试错误: ${error}`
    }
  })
  
  const passedCount = tests.value.filter(t => t.passed).length
  const totalCount = tests.value.length
  
  if (passedCount === totalCount) {
    ElMessage.success(`所有测试通过 (${passedCount}/${totalCount})`)
  } else {
    ElMessage.warning(`部分测试失败 (${passedCount}/${totalCount})`)
  }
}
</script>

<style scoped lang="scss">
.response-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-bg, #ffffff);
}

.response-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  background: var(--el-fill-color-lighter);
  
  .status-info {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .status-code {
      font-weight: 600;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      
      &.success {
        color: var(--el-color-success);
        background: var(--el-color-success-light-9);
      }
      
      &.warning {
        color: var(--el-color-warning);
        background: var(--el-color-warning-light-9);
      }
      
      &.error {
        color: var(--el-color-danger);
        background: var(--el-color-danger-light-9);
      }
      
      &.info {
        color: var(--el-color-info);
        background: var(--el-color-info-light-9);
      }
    }
    
    .response-meta {
      display: flex;
      gap: 16px;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .status-actions {
    display: flex;
    gap: 8px;
  }
}

.response-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-response,
.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
  
  .no-response-icon,
  .error-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
  }
  
  .error-icon {
    color: var(--el-color-danger);
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: var(--text-color, #303133);
  }
  
  p {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
  
  .error-message {
    margin-bottom: 16px;
    color: var(--el-color-danger);
    font-family: monospace;
  }
}

.response-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  :deep(.el-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .el-tabs__content {
      flex: 1;
      overflow: hidden;
    }
    
    .el-tab-pane {
      height: 100%;
      overflow-y: auto;
    }
  }
}

.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.response-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  background: var(--el-fill-color-lighter);
  
  .content-type {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
  }
}

.response-body {
  flex: 1;
  overflow: auto;
  
  &.pretty,
  &.raw {
    .formatted-content,
    .raw-content {
      margin: 0;
      padding: 16px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
      background: var(--el-fill-color-blank);
      border: none;
      outline: none;
    }
  }
  
  &.preview {
    .html-preview {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }
  }
}

.headers-list {
  padding: 16px;
  
  .header-item {
    display: flex;
    margin-bottom: 12px;
    
    .header-key {
      flex: 0 0 200px;
      font-weight: 600;
      color: var(--el-color-primary);
      font-family: monospace;
      font-size: 13px;
    }
    
    .header-value {
      flex: 1;
      color: var(--text-color, #303133);
      font-family: monospace;
      font-size: 13px;
      word-break: break-all;
    }
  }
}

.cookies-list {
  padding: 16px;
  
  .cookie-item {
    padding: 12px;
    border: 1px solid var(--border-color, #dcdfe6);
    border-radius: 6px;
    margin-bottom: 12px;
    
    .cookie-name {
      font-weight: 600;
      color: var(--el-color-primary);
      margin-bottom: 4px;
    }
    
    .cookie-value {
      font-family: monospace;
      font-size: 13px;
      margin-bottom: 8px;
      word-break: break-all;
    }
    
    .cookie-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.tests-section {
  padding: 16px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }
  
  .test-item {
    border: 1px solid var(--border-color, #dcdfe6);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;
    
    &.passed {
      border-color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }
    
    &.failed {
      border-color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }
    
    .test-config {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .test-result {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      
      .test-icon {
        &.passed {
          color: var(--el-color-success);
        }
        
        &.failed {
          color: var(--el-color-danger);
        }
      }
    }
  }
  
  .tests-actions {
    margin-top: 16px;
    text-align: center;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

// 响应式设计
@media (max-width: 768px) {
  .response-status {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    .status-info {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      
      .response-meta {
        justify-content: center;
      }
    }
    
    .status-actions {
      justify-content: center;
    }
  }
  
  .response-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .headers-list {
    .header-item {
      flex-direction: column;
      gap: 4px;
      
      .header-key {
        flex: none;
      }
    }
  }
  
  .test-item {
    .test-config {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>