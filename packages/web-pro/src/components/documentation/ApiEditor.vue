<template>
  <div class="api-editor">
    <div class="editor-header">
      <div class="api-info">
        <el-tag :type="getMethodType(api.method)" class="method-tag">
          {{ api.method }}
        </el-tag>
        <span class="api-path">{{ api.path }}</span>
      </div>
      <div class="editor-actions">
        <el-button @click="saveApi" type="primary" size="small" :loading="saving">
          保存
        </el-button>
        <el-button @click="testApi" size="small">
          测试
        </el-button>
      </div>
    </div>
    
    <div class="editor-content">
      <el-tabs v-model="activeTab" class="api-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <div class="basic-form">
            <el-form :model="api" label-width="100px">
              <el-form-item label="接口名称">
                <el-input v-model="api.name" placeholder="请输入接口名称" />
              </el-form-item>
              
              <el-form-item label="接口描述">
                <el-input
                  v-model="api.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入接口描述"
                />
              </el-form-item>
              
              <el-form-item label="请求方法">
                <el-select v-model="api.method">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="DELETE" value="DELETE" />
                  <el-option label="PATCH" value="PATCH" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="接口路径">
                <el-input v-model="api.path" placeholder="/api/users/{id}" />
              </el-form-item>
              
              <el-form-item label="标签">
                <el-select
                  v-model="api.tags"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或创建标签"
                >
                  <el-option
                    v-for="tag in availableTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="是否废弃">
                <el-switch v-model="api.deprecated" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 请求参数 -->
        <el-tab-pane label="请求参数" name="parameters">
          <div class="parameters-section">
            <div class="section-header">
              <h4>路径参数</h4>
              <el-button @click="addPathParameter" size="small" text>
                <el-icon><Plus /></el-icon>
                添加参数
              </el-button>
            </div>
            <ParameterTable
              v-model="api.parameters?.path || []"
              type="path"
              @delete="deleteParameter"
            />
            
            <div class="section-header">
              <h4>查询参数</h4>
              <el-button @click="addQueryParameter" size="small" text>
                <el-icon><Plus /></el-icon>
                添加参数
              </el-button>
            </div>
            <ParameterTable
              v-model="api.parameters?.query || []"
              type="query"
              @delete="deleteParameter"
            />
            
            <div class="section-header">
              <h4>请求头</h4>
              <el-button @click="addHeaderParameter" size="small" text>
                <el-icon><Plus /></el-icon>
                添加请求头
              </el-button>
            </div>
            <ParameterTable
              v-model="api.parameters?.header || []"
              type="header"
              @delete="deleteParameter"
            />
          </div>
        </el-tab-pane>
        
        <!-- 请求体 -->
        <el-tab-pane label="请求体" name="requestBody" v-if="hasRequestBody">
          <div class="request-body-section">
            <div class="content-type-selector">
              <el-select v-model="api.requestBody.contentType" placeholder="选择Content-Type">
                <el-option label="application/json" value="application/json" />
                <el-option label="application/x-www-form-urlencoded" value="application/x-www-form-urlencoded" />
                <el-option label="multipart/form-data" value="multipart/form-data" />
                <el-option label="text/plain" value="text/plain" />
              </el-select>
            </div>
            
            <div class="schema-editor">
              <h4>请求体结构</h4>
              <SchemaEditor v-model="api.requestBody.schema" />
            </div>
            
            <div class="example-editor">
              <h4>请求示例</h4>
              <CodeEditor
                v-model="api.requestBody.example"
                :language="getLanguageFromContentType(api.requestBody?.contentType || 'application/json')"
                height="200px"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 响应 -->
        <el-tab-pane label="响应" name="responses">
          <div class="responses-section">
            <div class="section-header">
              <h4>响应列表</h4>
              <el-button @click="addResponse" size="small" text>
                <el-icon><Plus /></el-icon>
                添加响应
              </el-button>
            </div>
            
            <div class="responses-list">
              <div
                v-for="(response, statusCode) in api.responses || {}"
                :key="statusCode"
                class="response-item"
              >
                <div class="response-header">
                  <el-tag :type="getStatusType(statusCode)" class="status-tag">
                    {{ statusCode }}
                  </el-tag>
                  <span class="response-description">{{ response.description }}</span>
                  <el-button @click="deleteResponse(statusCode)" size="small" text type="danger">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                
                <div class="response-content">
                  <el-tabs>
                    <el-tab-pane label="结构" name="schema">
                      <SchemaEditor v-model="response.schema" />
                    </el-tab-pane>
                    <el-tab-pane label="示例" name="example">
                      <CodeEditor
                        v-model="response.example"
                        language="json"
                        height="150px"
                      />
                    </el-tab-pane>
                    <el-tab-pane label="响应头" name="headers">
                      <ParameterTable
                        v-model="response.headers || []"
                        type="header"
                        @delete="deleteParameter"
                      />
                    </el-tab-pane>
                  </el-tabs>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 示例 -->
        <el-tab-pane label="示例" name="examples">
          <div class="examples-section">
            <div class="section-header">
              <h4>代码示例</h4>
              <el-button @click="generateExamples" size="small">
                自动生成
              </el-button>
            </div>
            
            <el-tabs v-model="exampleLanguage">
              <el-tab-pane label="cURL" name="curl">
                <CodeEditor
                  v-model="api.examples?.curl || ''"
                  language="bash"
                  height="200px"
                  readonly
                />
              </el-tab-pane>
              <el-tab-pane label="JavaScript" name="javascript">
                <CodeEditor
                  v-model="api.examples?.javascript || ''"
                  language="javascript"
                  height="200px"
                  readonly
                />
              </el-tab-pane>
              <el-tab-pane label="Python" name="python">
                <CodeEditor
                  v-model="api.examples?.python || ''"
                  language="python"
                  height="200px"
                  readonly
                />
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 添加响应对话框 -->
    <el-dialog v-model="showAddResponseDialog" title="添加响应" width="400px">
      <el-form :model="newResponse" label-width="80px">
        <el-form-item label="状态码">
          <el-select v-model="newResponse.statusCode" placeholder="选择状态码">
            <el-option label="200 - 成功" value="200" />
            <el-option label="201 - 已创建" value="201" />
            <el-option label="400 - 请求错误" value="400" />
            <el-option label="401 - 未授权" value="401" />
            <el-option label="403 - 禁止访问" value="403" />
            <el-option label="404 - 未找到" value="404" />
            <el-option label="500 - 服务器错误" value="500" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newResponse.description" placeholder="请输入响应描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddResponseDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddResponse">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import ParameterTable from './ParameterTable.vue'
import SchemaEditor from './SchemaEditor.vue'
import CodeEditor from './CodeEditor.vue'
import type { ApiDocItem, ApiParameter, ApiResponse } from '@/types'

interface Props {
  api: ApiDocItem
  availableTags?: string[]
}

interface Emits {
  'save': [api: ApiDocItem]
  'test': [api: ApiDocItem]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('basic')
const exampleLanguage = ref('curl')
const saving = ref(false)
const showAddResponseDialog = ref(false)

const newResponse = ref({
  statusCode: '200',
  description: ''
})

const hasRequestBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(props.api.method)
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

const getStatusType = (statusCode: string) => {
  const code = parseInt(statusCode)
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'warning'
  if (code >= 400 && code < 500) return 'danger'
  if (code >= 500) return 'danger'
  return 'info'
}

const getLanguageFromContentType = (contentType: string) => {
  if (contentType.includes('json')) return 'json'
  if (contentType.includes('xml')) return 'xml'
  return 'text'
}

const addPathParameter = () => {
  if (!props.api.parameters) {
    props.api.parameters = { path: [], query: [], header: [] }
  }
  if (!props.api.parameters.path) {
    props.api.parameters.path = []
  }
  props.api.parameters.path.push({
    name: '',
    type: 'string',
    required: true,
    description: ''
  })
}

const addQueryParameter = () => {
  if (!props.api.parameters) {
    props.api.parameters = { path: [], query: [], header: [] }
  }
  if (!props.api.parameters.query) {
    props.api.parameters.query = []
  }
  props.api.parameters.query.push({
    name: '',
    type: 'string',
    required: false,
    description: ''
  })
}

const addHeaderParameter = () => {
  if (!props.api.parameters) {
    props.api.parameters = { path: [], query: [], header: [] }
  }
  if (!props.api.parameters.header) {
    props.api.parameters.header = []
  }
  props.api.parameters.header.push({
    name: '',
    type: 'string',
    required: false,
    description: ''
  })
}

const deleteParameter = (type: string, index: number) => {
  if (!props.api.parameters) return
  
  if (type === 'path' && props.api.parameters.path) {
    props.api.parameters.path.splice(index, 1)
  } else if (type === 'query' && props.api.parameters.query) {
    props.api.parameters.query.splice(index, 1)
  } else if (type === 'header' && props.api.parameters.header) {
    props.api.parameters.header.splice(index, 1)
  }
}

const addResponse = () => {
  newResponse.value = {
    statusCode: '200',
    description: ''
  }
  showAddResponseDialog.value = true
}

const confirmAddResponse = () => {
  if (!newResponse.value.statusCode || !newResponse.value.description) {
    ElMessage.warning('请填写完整的响应信息')
    return
  }
  
  if (!props.api.responses) {
    props.api.responses = {}
  }
  
  props.api.responses[newResponse.value.statusCode] = {
    description: newResponse.value.description,
    schema: {},
    example: '',
    headers: []
  }
  
  showAddResponseDialog.value = false
  ElMessage.success('响应添加成功')
}

const deleteResponse = (statusCode: string) => {
  if (props.api.responses) {
    delete props.api.responses[statusCode]
  }
}

const generateExamples = () => {
  // 生成代码示例
  const baseUrl = 'https://api.example.com'
  const fullUrl = baseUrl + props.api.path
  
  // 初始化examples对象
  if (!props.api.examples) {
    props.api.examples = { curl: '', javascript: '', python: '' }
  }
  
  // cURL 示例
  let curlExample = `curl -X ${props.api.method} "${fullUrl}"`
  if (props.api.parameters?.header && props.api.parameters.header.length > 0) {
    props.api.parameters.header.forEach(header => {
      curlExample += ` \\
  -H "${header.name}: ${header.example || 'value'}"`
    })
  }
  if (hasRequestBody.value && props.api.requestBody?.example) {
    curlExample += ` \\
  -d '${props.api.requestBody.example}'`
  }
  
  props.api.examples.curl = curlExample
  
  // JavaScript 示例
  props.api.examples.javascript = `fetch('${fullUrl}', {
  method: '${props.api.method}',
  headers: {
    'Content-Type': 'application/json'
  }${hasRequestBody.value ? `,
  body: JSON.stringify(${props.api.requestBody?.example || '{}'})` : ''}
})
.then(response => response.json())
.then(data => console.log(data))`
  
  // Python 示例
  props.api.examples.python = `import requests

url = '${fullUrl}'
headers = {'Content-Type': 'application/json'}
${hasRequestBody.value ? `data = ${props.api.requestBody?.example || '{}'}

response = requests.${props.api.method.toLowerCase()}(url, headers=headers, json=data)` : `
response = requests.${props.api.method.toLowerCase()}(url, headers=headers)`}
print(response.json())`
  
  ElMessage.success('代码示例生成成功')
}

const saveApi = async () => {
  saving.value = true
  try {
    emit('save', props.api)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const testApi = () => {
  emit('test', props.api)
}
</script>

<style lang="scss" scoped>
.api-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
}

.editor-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.api-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.method-tag {
  font-weight: 600;
}

.api-path {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  color: #303133;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

.api-tabs {
  height: 100%;
  
  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow-y: auto;
    padding: 20px;
  }
}

.basic-form {
  max-width: 600px;
}

.parameters-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0 12px 0;
    
    h4 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }
}

.request-body-section {
  .content-type-selector {
    margin-bottom: 20px;
  }
  
  .schema-editor,
  .example-editor {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #606266;
    }
  }
}

.responses-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h4 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }
}

.response-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 16px;
  
  .response-header {
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    gap: 12px;
    
    .status-tag {
      font-weight: 600;
    }
    
    .response-description {
      flex: 1;
      color: #606266;
    }
  }
  
  .response-content {
    padding: 16px;
  }
}

.examples-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h4 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }
}
</style>