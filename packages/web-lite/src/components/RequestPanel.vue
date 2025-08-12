<template>
  <div class="request-panel">
    <!-- 请求方法和URL -->
    <div class="request-line">
      <el-select
        v-model="requestStore.currentRequest.method"
        class="method-select"
        placeholder="方法"
      >
        <el-option
          v-for="method in HTTP_METHODS"
          :key="method"
          :label="method"
          :value="method"
        />
      </el-select>
      
      <el-input
        v-model="requestStore.currentRequest.url"
        placeholder="请输入请求URL"
        class="url-input"
        @keyup.enter="handleSendRequest"
      >
        <template #prepend>
          <el-icon><Link /></el-icon>
        </template>
      </el-input>
      
      <el-button
        type="primary"
        :loading="requestStore.loading"
        @click="handleSendRequest"
        class="send-btn"
      >
        <el-icon v-if="!requestStore.loading"><Position /></el-icon>
        {{ requestStore.loading ? '发送中...' : '发送' }}
      </el-button>
    </div>
    
    <!-- 请求配置选项卡 -->
    <div class="request-tabs">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 请求参数 -->
        <el-tab-pane label="参数" name="params">
          <div class="tab-content">
            <div class="tab-header">
              <span class="tab-title">Query Parameters</span>
              <el-button
                type="text"
                size="small"
                @click="addParam"
              >
                <el-icon><Plus /></el-icon>
                添加参数
              </el-button>
            </div>
            
            <div class="params-list">
              <div
                v-for="(param, index) in requestStore.currentRequest.params"
                :key="index"
                class="param-item"
              >
                <el-checkbox
                  v-model="param.enabled"
                  class="param-checkbox"
                />
                <el-input
                  v-model="param.key"
                  placeholder="参数名"
                  class="param-key"
                />
                <el-input
                  v-model="param.value"
                  placeholder="参数值"
                  class="param-value"
                />
                <el-button
                  type="text"
                  size="small"
                  @click="removeParam(index)"
                  class="param-remove"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              
              <div v-if="requestStore.currentRequest.params.length === 0" class="empty-state">
                暂无参数
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 请求头 -->
        <el-tab-pane label="请求头" name="headers">
          <div class="tab-content">
            <div class="tab-header">
              <span class="tab-title">Headers</span>
              <el-button
                type="text"
                size="small"
                @click="addHeader"
              >
                <el-icon><Plus /></el-icon>
                添加请求头
              </el-button>
            </div>
            
            <div class="headers-list">
              <div
                v-for="(header, index) in requestStore.currentRequest.headers"
                :key="index"
                class="header-item"
              >
                <el-checkbox
                  v-model="header.enabled"
                  class="header-checkbox"
                />
                <el-input
                  v-model="header.key"
                  placeholder="请求头名称"
                  class="header-key"
                />
                <el-input
                  v-model="header.value"
                  placeholder="请求头值"
                  class="header-value"
                />
                <el-button
                  type="text"
                  size="small"
                  @click="removeHeader(index)"
                  class="header-remove"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              
              <div v-if="requestStore.currentRequest.headers.length === 0" class="empty-state">
                暂无请求头
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 认证 -->
        <el-tab-pane label="认证" name="auth">
          <div class="tab-content">
            <div class="auth-type">
              <el-form-item label="认证类型">
                <el-select
                  v-model="requestStore.currentRequest.auth.type"
                  placeholder="选择认证类型"
                  style="width: 200px;"
                >
                  <el-option
                    v-for="type in AUTH_TYPES"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>
            </div>
            
            <!-- Bearer Token -->
            <div v-if="requestStore.currentRequest.auth.type === 'bearer'" class="auth-config">
              <el-form-item label="Token">
                <el-input
                  v-model="requestStore.currentRequest.auth.token"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入Bearer Token"
                />
              </el-form-item>
            </div>
            
            <!-- Basic Auth -->
            <div v-if="requestStore.currentRequest.auth.type === 'basic'" class="auth-config">
              <el-form-item label="用户名">
                <el-input
                  v-model="requestStore.currentRequest.auth.username"
                  placeholder="请输入用户名"
                />
              </el-form-item>
              <el-form-item label="密码">
                <el-input
                  v-model="requestStore.currentRequest.auth.password"
                  type="password"
                  placeholder="请输入密码"
                  show-password
                />
              </el-form-item>
            </div>
            
            <!-- API Key -->
            <div v-if="requestStore.currentRequest.auth.type === 'apikey'" class="auth-config">
              <el-form-item label="Key">
                <el-input
                  v-model="requestStore.currentRequest.auth.key"
                  placeholder="请输入API Key名称"
                />
              </el-form-item>
              <el-form-item label="Value">
                <el-input
                  v-model="requestStore.currentRequest.auth.value"
                  placeholder="请输入API Key值"
                />
              </el-form-item>
              <el-form-item label="位置">
                <el-radio-group v-model="requestStore.currentRequest.auth.in">
                  <el-radio label="header">Header</el-radio>
                  <el-radio label="query">Query</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 请求体 -->
        <el-tab-pane
          label="请求体"
          name="body"
          :disabled="!['POST', 'PUT', 'PATCH', 'DELETE'].includes(requestStore.currentRequest.method)"
        >
          <div class="tab-content">
            <div class="body-type">
              <el-form-item label="请求体类型">
                <el-select
                  v-model="requestStore.currentRequest.body.type"
                  placeholder="选择请求体类型"
                  style="width: 200px;"
                >
                  <el-option
                    v-for="type in BODY_TYPES"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>
            </div>
            
            <!-- JSON -->
            <div v-if="requestStore.currentRequest.body.type === 'json'" class="body-content">
              <div class="editor-header">
                <span>JSON</span>
                <div class="editor-actions">
                  <el-button type="text" size="small" @click="formatJson">
                    格式化
                  </el-button>
                  <el-button type="text" size="small" @click="minifyJson">
                    压缩
                  </el-button>
                </div>
              </div>
              <el-input
                v-model="requestStore.currentRequest.body.raw"
                type="textarea"
                :rows="12"
                placeholder="请输入JSON数据"
                class="json-editor"
              />
            </div>
            
            <!-- Raw Text -->
            <div v-if="requestStore.currentRequest.body.type === 'raw'" class="body-content">
              <el-input
                v-model="requestStore.currentRequest.body.raw"
                type="textarea"
                :rows="12"
                placeholder="请输入原始文本数据"
              />
            </div>
            
            <!-- Form Data -->
            <div v-if="requestStore.currentRequest.body.type === 'form'" class="body-content">
              <div class="tab-header">
                <span class="tab-title">Form Data</span>
                <el-button
                  type="text"
                  size="small"
                  @click="addFormData"
                >
                  <el-icon><Plus /></el-icon>
                  添加字段
                </el-button>
              </div>
              
              <div class="form-data-list">
                <div
                  v-for="(item, index) in requestStore.currentRequest.body.formData"
                  :key="index"
                  class="form-data-item"
                >
                  <el-checkbox
                    v-model="item.enabled"
                    class="form-data-checkbox"
                  />
                  <el-input
                    v-model="item.key"
                    placeholder="字段名"
                    class="form-data-key"
                  />
                  <el-input
                    v-model="item.value"
                    placeholder="字段值"
                    class="form-data-value"
                  />
                  <el-button
                    type="text"
                    size="small"
                    @click="removeFormData(index)"
                    class="form-data-remove"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                
                <div v-if="requestStore.currentRequest.body.formData.length === 0" class="empty-state">
                  暂无表单数据
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 高级设置 -->
        <el-tab-pane label="高级" name="advanced">
          <div class="tab-content">
            <el-form label-width="120px">
              <el-form-item label="请求超时">
                <el-input-number
                  v-model="requestStore.currentRequest.timeout"
                  :min="1"
                  :max="300"
                  :step="1"
                  style="width: 150px;"
                />
                <span class="form-item-suffix">秒</span>
              </el-form-item>
              
              <el-form-item label="跟随重定向">
                <el-switch v-model="requestStore.currentRequest.followRedirects" />
              </el-form-item>
              
              <el-form-item label="SSL验证">
                <el-switch v-model="requestStore.currentRequest.verifySsl" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Link,
  Position,
  Plus,
  Delete
} from '@element-plus/icons-vue'
import { useRequestStore } from '@/stores/request'
import { HTTP_METHODS, AUTH_TYPES, BODY_TYPES } from '@/types'

const requestStore = useRequestStore()
const activeTab = ref('params')

// 发送请求
const handleSendRequest = async () => {
  if (!requestStore.currentRequest.url.trim()) {
    ElMessage.warning('请输入请求URL')
    return
  }
  
  try {
    await requestStore.sendRequest()
    ElMessage.success('请求发送成功')
  } catch (error) {
    ElMessage.error(`请求失败: ${error}`)
  }
}

// 参数管理
const addParam = () => {
  requestStore.currentRequest.params.push({
    key: '',
    value: '',
    enabled: true
  })
}

const removeParam = (index: number) => {
  requestStore.currentRequest.params.splice(index, 1)
}

// 请求头管理
const addHeader = () => {
  requestStore.currentRequest.headers.push({
    key: '',
    value: '',
    enabled: true
  })
}

const removeHeader = (index: number) => {
  requestStore.currentRequest.headers.splice(index, 1)
}

// 表单数据管理
const addFormData = () => {
  requestStore.currentRequest.body.formData.push({
    key: '',
    value: '',
    enabled: true
  })
}

const removeFormData = (index: number) => {
  requestStore.currentRequest.body.formData.splice(index, 1)
}

// JSON格式化
const formatJson = () => {
  try {
    const parsed = JSON.parse(requestStore.currentRequest.body.raw)
    requestStore.currentRequest.body.raw = JSON.stringify(parsed, null, 2)
    ElMessage.success('JSON格式化成功')
  } catch {
    ElMessage.error('JSON格式错误')
  }
}

// JSON压缩
const minifyJson = () => {
  try {
    const parsed = JSON.parse(requestStore.currentRequest.body.raw)
    requestStore.currentRequest.body.raw = JSON.stringify(parsed)
    ElMessage.success('JSON压缩成功')
  } catch {
    ElMessage.error('JSON格式错误')
  }
}
</script>

<style scoped lang="scss">
.request-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-bg, #ffffff);
}

.request-line {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  
  .method-select {
    width: 120px;
    flex-shrink: 0;
  }
  
  .url-input {
    flex: 1;
  }
  
  .send-btn {
    width: 100px;
    flex-shrink: 0;
  }
}

.request-tabs {
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
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .tab-title {
    font-weight: 600;
    color: var(--text-color, #303133);
  }
}

.params-list,
.headers-list,
.form-data-list {
  .param-item,
  .header-item,
  .form-data-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    .param-checkbox,
    .header-checkbox,
    .form-data-checkbox {
      flex-shrink: 0;
    }
    
    .param-key,
    .header-key,
    .form-data-key {
      flex: 1;
    }
    
    .param-value,
    .header-value,
    .form-data-value {
      flex: 2;
    }
    
    .param-remove,
    .header-remove,
    .form-data-remove {
      flex-shrink: 0;
      color: var(--el-color-danger);
    }
  }
}

.auth-config {
  margin-top: 16px;
}

.body-content {
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .editor-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .json-editor {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.form-item-suffix {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

// 响应式设计
@media (max-width: 768px) {
  .request-line {
    flex-direction: column;
    gap: 12px;
    
    .method-select,
    .send-btn {
      width: 100%;
    }
  }
  
  .params-list,
  .headers-list,
  .form-data-list {
    .param-item,
    .header-item,
    .form-data-item {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 12px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;
      margin-bottom: 12px;
      
      .param-remove,
      .header-remove,
      .form-data-remove {
        align-self: flex-end;
      }
    }
  }
}
</style>