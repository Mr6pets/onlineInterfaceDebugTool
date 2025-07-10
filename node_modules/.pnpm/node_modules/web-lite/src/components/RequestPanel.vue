<template>
  <el-card class="request-panel">
    <template #header>
      <div class="panel-header">
        <span>请求配置</span>
        <div class="header-actions">
          <el-button size="small" @click="importCurl">导入cURL</el-button>
          <el-button size="small" @click="saveRequest">保存</el-button>
        </div>
      </div>
    </template>
    
    <el-form :model="request" label-width="80px" class="request-form">
      <!-- 请求方法和URL -->
      <el-form-item label="请求">
        <div class="request-line">
          <el-select v-model="request.method" style="width: 100px; margin-right: 8px">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
            <el-option label="HEAD" value="HEAD" />
            <el-option label="OPTIONS" value="OPTIONS" />
          </el-select>
          <el-input 
            v-model="request.url" 
            placeholder="请输入接口地址，如：https://api.example.com/users"
            @keyup.enter="sendRequest"
            class="url-input"
          >
            <template #append>
              <el-button 
                type="primary" 
                @click="sendRequest"
                :loading="loading"
                :disabled="!request.url"
              >
                发送
              </el-button>
            </template>
          </el-input>
        </div>
      </el-form-item>
      
      <!-- 请求参数 -->
      <el-form-item label="参数" v-if="request.method === 'GET'">
        <div class="params-container">
          <div 
            v-for="(param, index) in params" 
            :key="index"
            class="param-row"
          >
            <el-checkbox v-model="param.enabled" style="margin-right: 8px" />
            <el-input 
              v-model="param.key" 
              placeholder="参数名"
              style="margin-right: 8px"
            />
            <el-input 
              v-model="param.value" 
              placeholder="参数值"
              style="margin-right: 8px"
            />
            <el-button 
              type="danger" 
              size="small"
              @click="removeParam(index)"
              :icon="Delete"
            />
          </div>
          <el-button @click="addParam" size="small" :icon="Plus">添加参数</el-button>
        </div>
      </el-form-item>
      
      <!-- 请求头 -->
      <el-form-item label="请求头">
        <div class="headers-container">
          <div 
            v-for="(header, index) in headers" 
            :key="index"
            class="header-row"
          >
            <el-checkbox v-model="header.enabled" style="margin-right: 8px" />
            <el-input 
              v-model="header.key" 
              placeholder="Header名称"
              style="margin-right: 8px"
            />
            <el-input 
              v-model="header.value" 
              placeholder="Header值"
              style="margin-right: 8px"
            />
            <el-button 
              type="danger" 
              size="small"
              @click="removeHeader(index)"
              :icon="Delete"
            />
          </div>
          <el-button @click="addHeader" size="small" :icon="Plus">添加Header</el-button>
        </div>
      </el-form-item>
      
      <!-- 认证 -->
      <el-form-item label="认证">
        <el-select v-model="authType" style="width: 150px; margin-right: 8px">
          <el-option label="无认证" value="none" />
          <el-option label="Bearer Token" value="bearer" />
          <el-option label="Basic Auth" value="basic" />
          <el-option label="API Key" value="apikey" />
        </el-select>
        
        <div v-if="authType === 'bearer'" class="auth-config">
          <el-input v-model="authConfig.token" placeholder="请输入Token" />
        </div>
        
        <div v-if="authType === 'basic'" class="auth-config">
          <el-input v-model="authConfig.username" placeholder="用户名" style="margin-right: 8px" />
          <el-input v-model="authConfig.password" type="password" placeholder="密码" />
        </div>
        
        <div v-if="authType === 'apikey'" class="auth-config">
          <el-input v-model="authConfig.key" placeholder="Key" style="margin-right: 8px" />
          <el-input v-model="authConfig.value" placeholder="Value" />
        </div>
      </el-form-item>
      
      <!-- 请求体 -->
      <el-form-item label="请求体" v-if="['POST', 'PUT', 'PATCH'].includes(request.method)">
        <el-tabs v-model="bodyType" class="body-tabs">
          <el-tab-pane label="JSON" name="json">
            <el-input 
              v-model="request.data"
              type="textarea"
              :rows="8"
              placeholder="请输入JSON格式的请求体"
              class="json-editor"
            />
            <div class="json-actions">
              <el-button size="small" @click="formatJson">格式化</el-button>
              <el-button size="small" @click="validateJson">验证</el-button>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Form Data" name="form">
            <div class="form-data-container">
              <div 
                v-for="(item, index) in formData" 
                :key="index"
                class="form-data-row"
              >
                <el-checkbox v-model="item.enabled" style="margin-right: 8px" />
                <el-input 
                  v-model="item.key" 
                  placeholder="字段名"
                  style="margin-right: 8px"
                />
                <el-input 
                  v-model="item.value" 
                  placeholder="字段值"
                  style="margin-right: 8px"
                />
                <el-select v-model="item.type" style="width: 80px; margin-right: 8px">
                  <el-option label="Text" value="text" />
                  <el-option label="File" value="file" />
                </el-select>
                <el-button 
                  type="danger" 
                  size="small"
                  @click="removeFormData(index)"
                  :icon="Delete"
                />
              </div>
              <el-button @click="addFormData" size="small" :icon="Plus">添加字段</el-button>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Raw" name="raw">
            <el-input 
              v-model="rawData"
              type="textarea"
              :rows="8"
              placeholder="请输入原始数据"
            />
          </el-tab-pane>
        </el-tabs>
      </el-form-item>
      
      <!-- 高级设置 -->
      <el-form-item label="高级设置">
        <el-collapse>
          <el-collapse-item title="请求设置" name="settings">
            <div class="advanced-settings">
              <el-form-item label="超时时间">
                <el-input-number v-model="request.timeout" :min="1000" :max="60000" :step="1000" />
                <span style="margin-left: 8px; color: #909399;">毫秒</span>
              </el-form-item>
              
              <el-form-item label="跟随重定向">
                <el-switch v-model="request.followRedirects" />
              </el-form-item>
              
              <el-form-item label="验证SSL">
                <el-switch v-model="request.verifySsl" />
              </el-form-item>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form-item>
    </el-form>
    
    <!-- cURL导入对话框 -->
    <el-dialog v-model="curlDialogVisible" title="导入cURL命令" width="600px">
      <el-input 
        v-model="curlCommand"
        type="textarea"
        :rows="6"
        placeholder="请粘贴cURL命令"
      />
      <template #footer>
        <el-button @click="curlDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="parseCurl">导入</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import { useRequestStore } from '../stores/request'
import type { RequestConfig } from '@api-debug-tool/shared/types'

const requestStore = useRequestStore()
const loading = ref(false)

// 请求配置
const request = ref<RequestConfig>({
  url: '',
  method: 'GET',
  data: '',
  timeout: 10000,
  followRedirects: true,
  verifySsl: true
})

// 参数管理
const params = ref<Array<{key: string, value: string, enabled: boolean}>>([
  { key: '', value: '', enabled: true }
])

// 请求头管理
const headers = ref<Array<{key: string, value: string, enabled: boolean}>>([
  { key: '', value: '', enabled: true }
])

// 认证配置
const authType = ref('none')
const authConfig = ref({
  token: '',
  username: '',
  password: '',
  key: '',
  value: ''
})

// 请求体配置
const bodyType = ref('json')
const formData = ref<Array<{key: string, value: string, type: string, enabled: boolean}>>([
  { key: '', value: '', type: 'text', enabled: true }
])
const rawData = ref('')

// cURL导入
const curlDialogVisible = ref(false)
const curlCommand = ref('')

// 参数操作
const addParam = () => {
  params.value.push({ key: '', value: '', enabled: true })
}

const removeParam = (index: number) => {
  params.value.splice(index, 1)
}

// 请求头操作
const addHeader = () => {
  headers.value.push({ key: '', value: '', enabled: true })
}

const removeHeader = (index: number) => {
  headers.value.splice(index, 1)
}

// 表单数据操作
const addFormData = () => {
  formData.value.push({ key: '', value: '', type: 'text', enabled: true })
}

const removeFormData = (index: number) => {
  formData.value.splice(index, 1)
}

// JSON操作
const formatJson = () => {
  try {
    const parsed = JSON.parse(request.value.data as string)
    request.value.data = JSON.stringify(parsed, null, 2)
    ElMessage.success('JSON格式化成功')
  } catch (error) {
    ElMessage.error('JSON格式错误')
  }
}

const validateJson = () => {
  try {
    JSON.parse(request.value.data as string)
    ElMessage.success('JSON格式正确')
  } catch (error) {
    ElMessage.error('JSON格式错误')
  }
}

// cURL导入
const importCurl = () => {
  curlDialogVisible.value = true
}

const parseCurl = () => {
  // 简单的cURL解析逻辑
  try {
    const curl = curlCommand.value.trim()
    
    // 提取URL
    const urlMatch = curl.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^'"\s]+)['"]?/)
    if (urlMatch) {
      request.value.url = urlMatch[1]
    }
    
    // 提取方法
    const methodMatch = curl.match(/-X\s+(\w+)/)
    if (methodMatch) {
      request.value.method = methodMatch[1].toUpperCase() as any
    }
    
    // 提取请求头
    const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]?/g)
    headers.value = []
    for (const match of headerMatches) {
      const [key, value] = match[1].split(': ')
      if (key && value) {
        headers.value.push({ key, value, enabled: true })
      }
    }
    
    // 提取数据
    const dataMatch = curl.match(/-d\s+['"]([^'"]+)['"]?/)
    if (dataMatch) {
      request.value.data = dataMatch[1]
    }
    
    curlDialogVisible.value = false
    ElMessage.success('cURL导入成功')
  } catch (error) {
    ElMessage.error('cURL解析失败')
  }
}

// 保存请求
const saveRequest = () => {
  // 这里可以实现保存到本地存储的逻辑
  ElMessage.success('请求已保存')
}

// 发送请求
const sendRequest = async () => {
  if (!request.value.url) {
    ElMessage.warning('请输入请求URL')
    return
  }
  
  loading.value = true
  
  try {
    // 构建请求头
    const requestHeaders: Record<string, string> = {}
    headers.value.forEach(header => {
      if (header.enabled && header.key && header.value) {
        requestHeaders[header.key] = header.value
      }
    })
    
    // 添加认证头
    if (authType.value === 'bearer' && authConfig.value.token) {
      requestHeaders['Authorization'] = `Bearer ${authConfig.value.token}`
    } else if (authType.value === 'basic' && authConfig.value.username && authConfig.value.password) {
      const credentials = btoa(`${authConfig.value.username}:${authConfig.value.password}`)
      requestHeaders['Authorization'] = `Basic ${credentials}`
    } else if (authType.value === 'apikey' && authConfig.value.key && authConfig.value.value) {
      requestHeaders[authConfig.value.key] = authConfig.value.value
    }
    
    // 构建URL参数
    let finalUrl = request.value.url
    if (request.value.method === 'GET' && params.value.some(p => p.enabled && p.key)) {
      const urlParams = new URLSearchParams()
      params.value.forEach(param => {
        if (param.enabled && param.key) {
          urlParams.append(param.key, param.value)
        }
      })
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + urlParams.toString()
    }
    
    // 构建请求体
    let requestData: any = undefined
    if (['POST', 'PUT', 'PATCH'].includes(request.value.method)) {
      if (bodyType.value === 'json') {
        requestData = request.value.data
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json'
        }
      } else if (bodyType.value === 'form') {
        const formDataObj = new FormData()
        formData.value.forEach(item => {
          if (item.enabled && item.key) {
            formDataObj.append(item.key, item.value)
          }
        })
        requestData = formDataObj
      } else if (bodyType.value === 'raw') {
        requestData = rawData.value
      }
    }
    
    const requestConfig: RequestConfig = {
      url: finalUrl,
      method: request.value.method,
      headers: requestHeaders,
      data: requestData,
      timeout: request.value.timeout
    }
    
    await requestStore.sendRequest(requestConfig)
    ElMessage.success('请求发送成功')
  } catch (error) {
    ElMessage.error('请求发送失败')
  } finally {
    loading.value = false
  }
}

// 监听请求方法变化，自动调整界面
watch(() => request.value.method, (newMethod) => {
  if (newMethod === 'GET') {
    bodyType.value = 'json'
  }
})
</script>

<style lang="scss" scoped>
.request-panel {
  height: 100%;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
  
  .request-form {
    .request-line {
      display: flex;
      align-items: center;
      
      .url-input {
        flex: 1;
      }
    }
    
    .params-container,
    .headers-container,
    .form-data-container {
      width: 100%;
      
      .param-row,
      .header-row,
      .form-data-row {
        display: flex;
        margin-bottom: 8px;
        align-items: center;
      }
    }
    
    .auth-config {
      display: flex;
      margin-top: 8px;
      
      .el-input {
        flex: 1;
      }
    }
    
    .body-tabs {
      .json-editor {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
      
      .json-actions {
        margin-top: 8px;
        text-align: right;
      }
    }
    
    .advanced-settings {
      .el-form-item {
        margin-bottom: 12px;
      }
    }
  }
}
</style>