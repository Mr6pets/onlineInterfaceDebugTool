<template>
  <el-card class="response-panel">
    <template #header>
      <div class="panel-header">
        <span>响应结果</span>
        <div class="response-info" v-if="response">
          <el-tag :type="getStatusType(response.status)">{{ response.status }} {{ response.statusText }}</el-tag>
          <span class="duration">{{ formatDuration(response.duration) }}</span>
          <span class="size">{{ formatSize(response.size) }}</span>
          <el-button-group size="small">
            <el-button @click="copyResponse" :icon="CopyDocument">复制</el-button>
            <el-button @click="downloadResponse" :icon="Download">下载</el-button>
            <el-button @click="shareResponse" :icon="Share">分享</el-button>
          </el-button-group>
        </div>
      </div>
    </template>
    
    <div class="response-content" v-if="response">
      <el-tabs v-model="activeTab" class="response-tabs">
        <!-- 响应体 -->
        <el-tab-pane name="body">
          <template #label>
            <span>响应体 <el-badge :value="getBodySize()" class="tab-badge" /></span>
          </template>
          
          <div class="response-body">
            <div class="body-toolbar">
              <el-button-group size="small">
                <el-button 
                  :type="bodyViewMode === 'pretty' ? 'primary' : ''"
                  @click="bodyViewMode = 'pretty'"
                >
                  美化
                </el-button>
                <el-button 
                  :type="bodyViewMode === 'raw' ? 'primary' : ''"
                  @click="bodyViewMode = 'raw'"
                >
                  原始
                </el-button>
                <el-button 
                  :type="bodyViewMode === 'preview' ? 'primary' : ''"
                  @click="bodyViewMode = 'preview'"
                  v-if="isHtmlContent"
                >
                  预览
                </el-button>
              </el-button-group>
              
              <div class="search-box">
                <el-input 
                  v-model="searchText"
                  placeholder="搜索内容"
                  size="small"
                  style="width: 200px"
                  :prefix-icon="Search"
                  clearable
                />
              </div>
            </div>
            
            <div class="body-content">
              <!-- 美化视图 -->
              <div v-if="bodyViewMode === 'pretty'" class="pretty-view">
                <pre v-html="highlightedContent"></pre>
              </div>
              
              <!-- 原始视图 -->
              <div v-else-if="bodyViewMode === 'raw'" class="raw-view">
                <pre>{{ response.data }}</pre>
              </div>
              
              <!-- HTML预览 -->
              <div v-else-if="bodyViewMode === 'preview'" class="preview-view">
                <iframe :srcdoc="response.data" class="html-preview"></iframe>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 响应头 -->
        <el-tab-pane name="headers">
          <template #label>
            <span>响应头 <el-badge :value="Object.keys(response.headers).length" class="tab-badge" /></span>
          </template>
          
          <div class="response-headers">
            <div class="headers-toolbar">
              <el-input 
                v-model="headerSearchText"
                placeholder="搜索响应头"
                size="small"
                style="width: 200px"
                :prefix-icon="Search"
                clearable
              />
            </div>
            
            <div class="headers-list">
              <div 
                v-for="(value, key) in filteredHeaders" 
                :key="key"
                class="header-item"
              >
                <div class="header-key">{{ key }}</div>
                <div class="header-value">{{ value }}</div>
                <el-button 
                  size="small" 
                  text 
                  @click="copyHeaderValue(value)"
                  :icon="CopyDocument"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- Cookies -->
        <el-tab-pane name="cookies" v-if="cookies.length > 0">
          <template #label>
            <span>Cookies <el-badge :value="cookies.length" class="tab-badge" /></span>
          </template>
          
          <div class="response-cookies">
            <el-table :data="cookies" style="width: 100%">
              <el-table-column prop="name" label="名称" width="150" />
              <el-table-column prop="value" label="值" show-overflow-tooltip />
              <el-table-column prop="domain" label="域" width="120" />
              <el-table-column prop="path" label="路径" width="100" />
              <el-table-column prop="expires" label="过期时间" width="150" />
              <el-table-column prop="httpOnly" label="HttpOnly" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.httpOnly ? 'success' : 'info'" size="small">
                    {{ row.httpOnly ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="secure" label="Secure" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.secure ? 'success' : 'info'" size="small">
                    {{ row.secure ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <!-- 测试结果 -->
        <el-tab-pane name="tests" v-if="testResults.length > 0">
          <template #label>
            <span>测试 <el-badge :value="testResults.length" class="tab-badge" /></span>
          </template>
          
          <div class="test-results">
            <div 
              v-for="(test, index) in testResults" 
              :key="index"
              class="test-item"
              :class="{ 'test-passed': test.passed, 'test-failed': !test.passed }"
            >
              <el-icon class="test-icon">
                <Check v-if="test.passed" />
                <Close v-else />
              </el-icon>
              <div class="test-content">
                <div class="test-name">{{ test.name }}</div>
                <div class="test-message" v-if="test.message">{{ test.message }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <el-empty description="暂无响应数据">
        <template #image>
          <el-icon size="64" color="#c0c4cc">
            <Document />
          </el-icon>
        </template>
        <template #description>
          <p>发送请求后，响应结果将在这里显示</p>
        </template>
      </el-empty>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  CopyDocument, 
  Download, 
  Share, 
  Search, 
  Check, 
  Close, 
  Document 
} from '@element-plus/icons-vue'
import { useRequestStore } from '../stores/request'

const requestStore = useRequestStore()
const activeTab = ref('body')
const bodyViewMode = ref('pretty')
const searchText = ref('')
const headerSearchText = ref('')

const response = computed(() => requestStore.response)

// 计算属性
const isHtmlContent = computed(() => {
  if (!response.value) return false
  const contentType = response.value.headers['content-type'] || ''
  return contentType.includes('text/html')
})

const filteredHeaders = computed(() => {
  if (!response.value || !headerSearchText.value) return response.value?.headers || {}
  
  const filtered: Record<string, string> = {}
  Object.entries(response.value.headers).forEach(([key, value]) => {
    if (key.toLowerCase().includes(headerSearchText.value.toLowerCase()) ||
        value.toLowerCase().includes(headerSearchText.value.toLowerCase())) {
      filtered[key] = value
    }
  })
  return filtered
})

const highlightedContent = computed(() => {
  if (!response.value) return ''
  
  let content = formatResponseData(response.value.data)
  
  // 简单的语法高亮
  if (isJsonContent.value) {
    content = highlightJson(content)
  }
  
  // 搜索高亮
  if (searchText.value) {
    const regex = new RegExp(`(${escapeRegExp(searchText.value)})`, 'gi')
    content = content.replace(regex, '<mark>$1</mark>')
  }
  
  return content
})

const isJsonContent = computed(() => {
  if (!response.value) return false
  const contentType = response.value.headers['content-type'] || ''
  return contentType.includes('application/json')
})

const cookies = computed(() => {
  if (!response.value) return []
  
  const setCookieHeader = response.value.headers['set-cookie']
  if (!setCookieHeader) return []
  
  // 解析Cookie（简化版）
  const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  return cookieStrings.map(cookieStr => {
    const parts = cookieStr.split(';')
    const [name, value] = parts[0].split('=')
    
    const cookie: any = { name: name?.trim(), value: value?.trim() }
    
    parts.slice(1).forEach(part => {
      const [key, val] = part.split('=')
      const trimmedKey = key?.trim().toLowerCase()
      
      switch (trimmedKey) {
        case 'domain':
          cookie.domain = val?.trim()
          break
        case 'path':
          cookie.path = val?.trim()
          break
        case 'expires':
          cookie.expires = val?.trim()
          break
        case 'httponly':
          cookie.httpOnly = true
          break
        case 'secure':
          cookie.secure = true
          break
      }
    })
    
    return cookie
  })
})

const testResults = ref<Array<{name: string, passed: boolean, message?: string}>>([])

// 方法
const getStatusType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400 && status < 500) return 'danger'
  if (status >= 500) return 'danger'
  return 'info'
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getBodySize = () => {
  if (!response.value) return 0
  return formatSize(response.value.size)
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

const highlightJson = (json: string) => {
  return json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>')
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const copyResponse = async () => {
  if (!response.value) return
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(response.value.data, null, 2))
    ElMessage.success('响应内容已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const copyHeaderValue = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value)
    ElMessage.success('Header值已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const downloadResponse = () => {
  if (!response.value) return
  
  const content = JSON.stringify(response.value.data, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `response_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('响应内容已下载')
}

const shareResponse = () => {
  // 这里可以实现分享功能
  ElMessage.info('分享功能开发中')
}

// 监听响应变化，自动运行测试
watch(response, (newResponse) => {
  if (newResponse) {
    runAutoTests(newResponse)
  }
}, { immediate: true })

const runAutoTests = (responseData: any) => {
  testResults.value = []
  
  // 状态码测试
  testResults.value.push({
    name: '状态码检查',
    passed: responseData.status >= 200 && responseData.status < 300,
    message: `状态码: ${responseData.status}`
  })
  
  // 响应时间测试
  testResults.value.push({
    name: '响应时间检查',
    passed: responseData.duration < 5000,
    message: `响应时间: ${responseData.duration}ms`
  })
  
  // JSON格式测试
  if (isJsonContent.value) {
    try {
      JSON.parse(typeof responseData.data === 'string' ? responseData.data : JSON.stringify(responseData.data))
      testResults.value.push({
        name: 'JSON格式检查',
        passed: true,
        message: 'JSON格式正确'
      })
    } catch {
      testResults.value.push({
        name: 'JSON格式检查',
        passed: false,
        message: 'JSON格式错误'
      })
    }
  }
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
        font-weight: normal;
      }
    }
  }
  
  .response-content {
    height: calc(100% - 60px);
    
    .response-tabs {
      height: 100%;
      
      :deep(.el-tabs__content) {
        height: calc(100% - 40px);
        overflow: hidden;
      }
      
      .tab-badge {
        margin-left: 4px;
      }
    }
    
    .response-body {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      .body-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed;
      }
      
      .body-content {
        flex: 1;
        overflow: hidden;
        
        .pretty-view,
        .raw-view {
          height: 100%;
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
            
            :deep(.json-key) { color: #d73a49; }
            :deep(.json-string) { color: #032f62; }
            :deep(.json-number) { color: #005cc5; }
            :deep(.json-boolean) { color: #e36209; }
            :deep(.json-null) { color: #6f42c1; }
            :deep(mark) { background: #fff3cd; padding: 2px 4px; border-radius: 2px; }
          }
        }
        
        .preview-view {
          height: 100%;
          
          .html-preview {
            width: 100%;
            height: 100%;
            border: 1px solid #e4e7ed;
            border-radius: 4px;
          }
        }
      }
    }
    
    .response-headers {
      height: 100%;
      
      .headers-toolbar {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed;
      }
      
      .headers-list {
        height: calc(100% - 50px);
        overflow: auto;
        
        .header-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          
          .header-key {
            font-weight: 600;
            color: #409eff;
            min-width: 150px;
            margin-right: 12px;
          }
          
          .header-value {
            flex: 1;
            font-family: monospace;
            word-break: break-all;
          }
        }
      }
    }
    
    .response-cookies {
      height: 100%;
      overflow: auto;
    }
    
    .test-results {
      height: 100%;
      overflow: auto;
      
      .test-item {
        display: flex;
        align-items: flex-start;
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
        
        &.test-passed {
          background: #f0f9ff;
          border-color: #67c23a;
          
          .test-icon {
            color: #67c23a;
          }
        }
        
        &.test-failed {
          background: #fef0f0;
          border-color: #f56c6c;
          
          .test-icon {
            color: #f56c6c;
          }
        }
        
        .test-icon {
          margin-right: 8px;
          margin-top: 2px;
        }
        
        .test-content {
          flex: 1;
          
          .test-name {
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .test-message {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
  
  .empty-state {
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>