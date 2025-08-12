<template>
  <div class="request-panel">
    <div class="request-header">
      <div class="request-line">
        <el-select 
          v-model="localRequest.method" 
          style="width: 120px"
          @change="updateRequest"
        >
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
          <el-option label="HEAD" value="HEAD" />
          <el-option label="OPTIONS" value="OPTIONS" />
        </el-select>
        
        <el-input 
          v-model="localRequest.url" 
          placeholder="请输入请求URL"
          @input="updateRequest"
          class="url-input"
        >
          <template #prepend>
            <span>URL</span>
          </template>
        </el-input>
        
        <el-button 
          type="primary" 
          @click="sendRequest"
          :loading="sending"
        >
          发送
        </el-button>
      </div>
    </div>
    
    <div class="request-body">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="参数" name="params">
          <div class="params-section">
            <div class="section-header">
              <span>查询参数</span>
            </div>
            <div class="params-list">
              <div 
                v-for="(_, key) in localRequest.params" 
                :key="key"
                class="param-item"
              >
                <el-input 
                  :model-value="key" 
                  placeholder="参数名"
                  @input="(newKey: string) => updateParamKey(key, newKey)"
                />
                <el-input 
                  v-model="localRequest.params![key]" 
                  placeholder="参数值"
                  @input="updateRequest"
                />
                <el-button 
                  size="small" 
                  text 
                  @click="removeParam(key)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button size="small" @click="showAddParamDialog">
                <el-icon><Plus /></el-icon>
                添加参数
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="请求头" name="headers">
          <div class="headers-section">
            <div class="section-header">
              <span>请求头</span>
            </div>
            <div class="headers-list">
              <div 
                v-for="(_, key) in localRequest.headers" 
                :key="key"
                class="header-item"
              >
                <el-input 
                  :model-value="key" 
                  placeholder="请求头名称"
                  @input="(newKey: string) => updateHeaderKey(key, newKey)"
                />
                <el-input 
                  v-model="localRequest.headers![key]" 
                  placeholder="请求头值"
                  @input="updateRequest"
                />
                <el-button 
                  size="small" 
                  text 
                  @click="removeHeader(key)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button size="small" @click="showAddHeaderDialog">
                <el-icon><Plus /></el-icon>
                添加请求头
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="请求体" name="body">
          <div class="body-section">
            <div class="body-type-selector">
              <el-radio-group v-model="bodyType" @change="updateRequest">
                <el-radio-button label="none">无</el-radio-button>
                <el-radio-button label="json">JSON</el-radio-button>
                <el-radio-button label="form">表单</el-radio-button>
                <el-radio-button label="raw">原始</el-radio-button>
              </el-radio-group>
            </div>
            
            <div v-if="bodyType === 'json'" class="json-editor">
              <el-input 
                v-model="localRequest.body" 
                type="textarea" 
                :rows="10"
                placeholder="请输入JSON格式的请求体"
                @input="updateRequest"
              />
            </div>
            
            <div v-else-if="bodyType === 'form'" class="form-data">
              <div 
                v-for="(item, index) in formData" 
                :key="index"
                class="form-item"
              >
                <el-checkbox v-model="item.enabled" />
                <el-input 
                  v-model="item.key" 
                  placeholder="字段名"
                  @input="updateRequest"
                />
                <el-input 
                  v-model="item.value" 
                  placeholder="字段值"
                  @input="updateRequest"
                />
                <el-button 
                  size="small" 
                  text 
                  @click="removeFormItem(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button size="small" @click="addFormItem">
                <el-icon><Plus /></el-icon>
                添加字段
              </el-button>
            </div>
            
            <div v-else-if="bodyType === 'raw'" class="raw-body">
              <el-input 
                v-model="localRequest.body" 
                type="textarea" 
                :rows="10"
                placeholder="请输入原始请求体内容"
                @input="updateRequest"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <div v-if="response" class="response-section">
      <div class="response-header">
        <h3>响应结果</h3>
        <div class="response-info">
          <el-tag 
            :type="getStatusType(response.status)"
            size="small"
          >
            {{ response.status }} {{ response.statusText }}
          </el-tag>
          <span class="response-time">{{ response.time }}ms</span>
          <span class="response-size">{{ formatSize(response.size) }}</span>
        </div>
      </div>
      
      <el-tabs v-model="responseTab" type="border-card">
        <el-tab-pane label="响应体" name="body">
          <div class="response-body">
            <el-input 
              :model-value="formatResponseBody(response.data)" 
              type="textarea" 
              :rows="15"
              readonly
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="响应头" name="headers">
          <div class="response-headers">
            <el-table :data="response.headers" size="small">
              <el-table-column prop="key" label="名称" width="200" />
              <el-table-column prop="value" label="值" />
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { Environment } from '@shared/types'

interface RequestConfig {
  url: string
  method: string
  params?: Record<string, string>
  headers?: Record<string, string>
  body?: string
}

interface Props {
  request: RequestConfig
  environment?: Environment
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:request': [request: RequestConfig]
  'send-request': [request: RequestConfig]
}>()

const localRequest = reactive<RequestConfig>({
  url: '',
  method: 'GET',
  params: {},
  headers: {},
  body: ''
})

const activeTab = ref('params')
const responseTab = ref('body')
const bodyType = ref('none')
const sending = ref(false)
const response = ref<any>(null)
const formData = ref<Array<{ key: string; value: string; enabled: boolean }>>([])

// 监听 props 变化
watch(() => props.request, (newRequest) => {
  Object.assign(localRequest, {
    url: newRequest.url || '',
    method: newRequest.method || 'GET',
    params: newRequest.params || {},
    headers: newRequest.headers || {},
    body: newRequest.body || ''
  })
}, { immediate: true, deep: true })

const updateRequest = () => {
  emit('update:request', { ...localRequest })
}

const addParam = (key: string, value: string) => {
  if (!localRequest.params) localRequest.params = {}
  localRequest.params[key] = value
  updateRequest()
}

const removeParam = (key: string) => {
  if (localRequest.params) {
    delete localRequest.params[key]
  }
  updateRequest()
}

const updateParamKey = (oldKey: string, newKey: string) => {
  if (localRequest.params && oldKey !== newKey) {
    const value = localRequest.params[oldKey]
    delete localRequest.params[oldKey]
    localRequest.params[newKey] = value
    updateRequest()
  }
}

const showAddParamDialog = () => {
  const key = prompt('请输入参数名:')
  if (key) {
    addParam(key, '')
  }
}

const addHeader = (key: string, value: string) => {
  if (!localRequest.headers) localRequest.headers = {}
  localRequest.headers[key] = value
  updateRequest()
}

const removeHeader = (key: string) => {
  if (localRequest.headers) {
    delete localRequest.headers[key]
  }
  updateRequest()
}

const updateHeaderKey = (oldKey: string, newKey: string) => {
  if (localRequest.headers && oldKey !== newKey) {
    const value = localRequest.headers[oldKey]
    delete localRequest.headers[oldKey]
    localRequest.headers[newKey] = value
    updateRequest()
  }
}

const showAddHeaderDialog = () => {
  const key = prompt('请输入请求头名称:')
  if (key) {
    addHeader(key, '')
  }
}

const addFormItem = () => {
  formData.value.push({ key: '', value: '', enabled: true })
  updateRequest()
}

const removeFormItem = (index: number) => {
  formData.value.splice(index, 1)
  updateRequest()
}

const sendRequest = async () => {
  sending.value = true
  
  try {
    // 模拟发送请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟响应数据
    response.value = {
      status: 200,
      statusText: 'OK',
      time: 245,
      size: 1024,
      data: {
        message: 'Success',
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      },
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Content-Length', value: '1024' },
        { key: 'Server', value: 'nginx/1.18.0' }
      ]
    }
    
    emit('send-request', localRequest)
    ElMessage.success('请求发送成功')
  } catch (error) {
    ElMessage.error('请求发送失败')
  } finally {
    sending.value = false
  }
}

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

const formatResponseBody = (data: any) => {
  if (typeof data === 'string') return data
  return JSON.stringify(data, null, 2)
}
</script>

<style scoped>
.request-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.request-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.request-line {
  display: flex;
  gap: 12px;
  align-items: center;
}

.url-input {
  flex: 1;
}

.request-body {
  flex: 1;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 500;
}

.params-list,
.headers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item,
.header-item,
.form-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.param-item .el-input,
.header-item .el-input,
.form-item .el-input {
  flex: 1;
}

.body-type-selector {
  margin-bottom: 16px;
}

.json-editor,
.raw-body {
  height: 300px;
}

.form-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-section {
  border-top: 1px solid #e4e7ed;
  flex: 1;
  overflow: hidden;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.response-header h3 {
  margin: 0;
  font-size: 16px;
}

.response-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.response-time,
.response-size {
  font-size: 12px;
  color: #909399;
}

.response-body {
  height: 400px;
}

.response-headers {
  max-height: 400px;
  overflow-y: auto;
}

:deep(.el-tabs__content) {
  padding: 16px;
  height: calc(100% - 40px);
  overflow-y: auto;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}
</style>