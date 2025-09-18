<template>
  <div class="mock-server-container">
    <!-- Header -->
    <div class="mock-header">
      <div class="mock-title">
        <h2>Mock服务器</h2>
        <el-tag :type="serverStatus === 'running' ? 'success' : 'danger'" size="large">
          {{ serverStatus === 'running' ? '运行中' : '已停止' }}
        </el-tag>
      </div>
      <div class="mock-actions">
        <el-button-group>
          <el-button 
            :type="serverStatus === 'running' ? 'danger' : 'primary'"
            @click="toggleServer"
            :loading="serverLoading"
          >
            {{ serverStatus === 'running' ? '停止服务器' : '启动服务器' }}
          </el-button>
          <el-button @click="showSettings = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
          <el-button @click="exportRoutes">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button @click="importRoutes">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- Server Info -->
    <el-card class="server-info" v-if="serverStatus === 'running'">
      <div class="info-grid">
        <div class="info-item">
          <span class="label">服务地址:</span>
          <el-link :href="serverUrl" target="_blank" type="primary">
            {{ serverUrl }}
          </el-link>
        </div>
        <div class="info-item">
          <span class="label">端口:</span>
          <span>{{ mockSettings.port }}</span>
        </div>
        <div class="info-item">
          <span class="label">请求总数:</span>
          <span>{{ stats.totalRequests }}</span>
        </div>
        <div class="info-item">
          <span class="label">活跃路由:</span>
          <span>{{ stats.activeRoutes }}</span>
        </div>
      </div>
    </el-card>

    <!-- Routes Management -->
    <el-card class="routes-section">
      <template #header>
        <div class="section-header">
          <span>路由管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchText"
              placeholder="搜索路由..."
              style="width: 200px; margin-right: 10px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterMethod" placeholder="方法" style="width: 100px; margin-right: 10px">
              <el-option label="全部" value="" />
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="DELETE" value="DELETE" />
              <el-option label="PATCH" value="PATCH" />
            </el-select>
            <el-button type="primary" @click="showRouteDialog = true">
              <el-icon><Plus /></el-icon>
              添加路由
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredRoutes" style="width: 100%">
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column prop="enabled" label="状态" width="80">
          <template #default="{ row }">
            <el-switch 
              v-model="row.enabled" 
              @change="toggleRoute(row)"
              :disabled="serverStatus !== 'running'"
            />
          </template>
        </el-table-column>
        <el-table-column prop="hitCount" label="命中次数" width="100" />
        <el-table-column prop="lastHit" label="最后命中" width="150">
          <template #default="{ row }">
            {{ row.lastHit ? formatTime(row.lastHit) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button @click="editRoute(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button @click="duplicateRoute(row)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button @click="testRoute(row)">
                <el-icon><Position /></el-icon>
              </el-button>
              <el-button type="danger" @click="deleteRoute(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Request Logs -->
    <el-card class="logs-section">
      <template #header>
        <div class="section-header">
          <span>请求日志</span>
          <div class="header-actions">
            <el-button @click="clearLogs" size="small">
              <el-icon><Delete /></el-icon>
              清空日志
            </el-button>
            <el-button @click="exportLogs" size="small">
              <el-icon><Download /></el-icon>
              导出日志
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="requestLogs" style="width: 100%" max-height="300">
        <el-table-column prop="timestamp" label="时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="200" />
        <el-table-column prop="statusCode" label="状态码" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.statusCode)" size="small">
              {{ row.statusCode }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responseTime" label="响应时间" width="100">
          <template #default="{ row }">
            {{ row.responseTime }}ms
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="120" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" @click="viewLogDetail(row)">
              <el-icon><View /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Route Dialog -->
    <el-dialog 
      v-model="showRouteDialog" 
      :title="editingRoute ? '编辑路由' : '添加路由'"
      width="800px"
      @close="resetRouteForm"
    >
      <el-form :model="routeForm" :rules="routeRules" ref="routeFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="请求方法" prop="method">
              <el-select v-model="routeForm.method" style="width: 100%">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
                <el-option label="PATCH" value="PATCH" />
                <el-option label="HEAD" value="HEAD" />
                <el-option label="OPTIONS" value="OPTIONS" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="路径" prop="path">
              <el-input v-model="routeForm.path" placeholder="/api/users/:id" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="描述">
          <el-input v-model="routeForm.description" placeholder="路由描述" />
        </el-form-item>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="响应配置" name="response">
            <el-form-item label="状态码">
              <el-input-number v-model="routeForm.response!.statusCode" :min="100" :max="599" />
            </el-form-item>
            
            <el-form-item label="响应头">
              <div class="headers-editor">
                <div v-for="(header, index) in routeForm.response?.headers" :key="index" class="header-row">
                  <el-input v-model="header.key" placeholder="Header名称" style="width: 40%" />
                  <el-input v-model="header.value" placeholder="Header值" style="width: 50%; margin: 0 5px" />
                  <el-button @click="removeHeader(index)" type="danger" size="small">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button @click="addHeader" type="primary" size="small">
                  <el-icon><Plus /></el-icon>
                  添加Header
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="响应体类型">
              <el-select v-model="routeForm.response!.bodyType" style="width: 200px">
                <el-option label="JSON" value="json" />
                <el-option label="文本" value="text" />
                <el-option label="HTML" value="html" />
                <el-option label="XML" value="xml" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="响应体">
              <el-input 
                v-model="routeForm.response!.body" 
                type="textarea" 
                :rows="8"
                :placeholder='routeForm.response?.bodyType === "json" ? "{ \"message\": \"Hello World\" }" : "响应内容"'
              />
            </el-form-item>
            
            <el-form-item label="从文件导入">
              <el-upload
                class="upload-demo"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  拖拽文件到此处或<em>点击上传</em>
                </div>
              </el-upload>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="高级设置" name="advanced">
            <el-form-item label="延迟(ms)">
              <el-input-number v-model="routeForm.delay" :min="0" :max="10000" />
            </el-form-item>
            
            <el-form-item label="条件匹配">
              <div class="conditions-editor">
                <div v-for="(condition, index) in routeForm.conditions" :key="index" class="condition-row">
                  <el-select v-model="condition.type" style="width: 30%">
                    <el-option label="Query参数" value="query" />
                    <el-option label="Header" value="header" />
                    <el-option label="Body" value="body" />
                  </el-select>
                  <el-input v-model="condition.field" placeholder="字段" style="width: 25%; margin: 0 5px" />
                  <el-select v-model="condition.operator" style="width: 20%; margin-right: 5px">
                    <el-option label="等于" value="equals" />
                    <el-option label="包含" value="contains" />
                    <el-option label="正则" value="regex" />
                  </el-select>
                  <el-input v-model="condition.value" placeholder="值" style="width: 15%; margin-right: 5px" />
                  <el-button @click="removeCondition(index)" type="danger" size="small">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button @click="addCondition" type="primary" size="small">
                  <el-icon><Plus /></el-icon>
                  添加条件
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="启用状态">
              <el-switch v-model="routeForm.enabled" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      
      <template #footer>
        <el-button @click="showRouteDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRoute" :loading="saving">
          {{ editingRoute ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Settings Dialog -->
    <el-dialog v-model="showSettings" title="Mock服务器设置" width="600px">
      <el-form :model="mockSettings" label-width="120px">
        <el-form-item label="端口">
          <el-input-number v-model="mockSettings.port" :min="1000" :max="65535" />
        </el-form-item>
        
        <el-form-item label="主机">
          <el-input v-model="mockSettings.host" placeholder="localhost" />
        </el-form-item>
        
        <el-form-item label="CORS">
          <el-switch v-model="mockSettings.cors" />
        </el-form-item>
        
        <el-form-item label="日志级别">
          <el-select v-model="mockSettings.logLevel">
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="最大日志数">
          <el-input-number v-model="mockSettings.maxLogs" :min="100" :max="10000" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">
          保存设置
        </el-button>
      </template>
    </el-dialog>

    <!-- Log Detail Dialog -->
    <el-dialog v-model="showLogDetail" title="请求详情" width="800px">
      <div v-if="selectedLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatTime(selectedLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="方法">
            <el-tag :type="getMethodType(selectedLog.method)">
              {{ selectedLog.method }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="路径">
            {{ selectedLog.path }}
          </el-descriptions-item>
          <el-descriptions-item label="状态码">
            <el-tag :type="getStatusType(selectedLog.statusCode)">
              {{ selectedLog.statusCode }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="响应时间">
            {{ selectedLog.responseTime }}ms
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ selectedLog.ip }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-tabs style="margin-top: 20px">
          <el-tab-pane label="请求头">
            <pre>{{ JSON.stringify(selectedLog.requestHeaders, null, 2) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="请求体">
            <pre>{{ selectedLog.requestBody || '无请求体' }}</pre>
          </el-tab-pane>
          <el-tab-pane label="响应头">
            <pre>{{ JSON.stringify(selectedLog.responseHeaders, null, 2) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="响应体">
            <pre>{{ selectedLog.responseBody || '无响应体' }}</pre>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { MockRoute, MockServerSettings, MockLog } from '@/types'
import { useMockStore } from '@/stores/mock'

const mockStore = useMockStore()

// Reactive data
const serverStatus = ref<'running' | 'stopped'>('stopped')
const serverLoading = ref(false)
const searchText = ref('')
const filterMethod = ref('')
const showRouteDialog = ref(false)
const showSettings = ref(false)
const showLogDetail = ref(false)
const editingRoute = ref<MockRoute | null>(null)
const selectedLog = ref<MockLog | null>(null)
const activeTab = ref('response')
const saving = ref(false)

// Form data
const routeForm = ref<Partial<MockRoute>>({
  method: 'GET',
  path: '',
  description: '',
  enabled: true,
  response: {
    statusCode: 200,
    headers: [],
    body: '',
    bodyType: 'json'
  },
  conditions: [],
  delay: 0
})

const mockSettings = ref<MockServerSettings>({
  port: 3001,
  host: 'localhost',
  cors: true,
  logging: true,
  logLevel: 'info',
  maxRequestSize: 1024 * 1024,
  timeout: 30000,
  maxLogs: 1000
})

const routeRules = {
  method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }]
}

// Computed
const serverUrl = computed(() => {
  return `http://${mockSettings.value.host}:${mockSettings.value.port}`
})

const filteredRoutes = computed(() => {
  let routes = mockStore.routes
  
  if (searchText.value) {
    routes = routes.filter(route => 
      route.path.toLowerCase().includes(searchText.value.toLowerCase()) ||
      route.description?.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }
  
  if (filterMethod.value) {
    routes = routes.filter(route => route.method === filterMethod.value)
  }
  
  return routes
})

const requestLogs = computed(() => mockStore.requestLogs.slice(-100))

const stats = computed(() => ({
  totalRequests: requestLogs.value.length,
  activeRoutes: mockStore.routes.filter(r => r.enabled).length
}))

// Methods
const toggleServer = async () => {
  serverLoading.value = true
  try {
    if (serverStatus.value === 'running') {
      await mockStore.stopServer()
      serverStatus.value = 'stopped'
      ElMessage.success('Mock服务器已停止')
    } else {
      await mockStore.startServer(mockSettings.value)
      serverStatus.value = 'running'
      ElMessage.success(`Mock服务器已启动: ${serverUrl.value}`)
    }
  } catch (error) {
    ElMessage.error('服务器操作失败: ' + (error as Error).message)
  } finally {
    serverLoading.value = false
  }
}

const editRoute = (route: MockRoute) => {
  editingRoute.value = route
  routeForm.value = { ...route }
  showRouteDialog.value = true
}

const duplicateRoute = (route: MockRoute) => {
  const newRoute = {
    ...route,
    id: undefined,
    path: route.path + '_copy',
    hitCount: 0,
    lastHit: undefined
  }
  editingRoute.value = null
  routeForm.value = newRoute
  showRouteDialog.value = true
}

const deleteRoute = async (route: MockRoute) => {
  try {
    await ElMessageBox.confirm('确定要删除这个路由吗？', '确认删除', {
      type: 'warning'
    })
    await mockStore.deleteRoute(route.id)
    ElMessage.success('路由已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const testRoute = async (route: MockRoute) => {
  try {
    const response = await fetch(`${serverUrl.value}${route.path}`, {
      method: route.method
    })
    await response.text()
    ElMessage.success(`测试成功: ${response.status}`)
  } catch (error) {
    ElMessage.error('测试失败: ' + (error as Error).message)
  }
}

const toggleRoute = async (route: MockRoute) => {
  try {
    await mockStore.updateRoute(route.id, { enabled: route.enabled })
    ElMessage.success(route.enabled ? '路由已启用' : '路由已禁用')
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const saveRoute = async () => {
  saving.value = true
  try {
    if (editingRoute.value) {
      await mockStore.updateRoute(editingRoute.value.id, routeForm.value)
      ElMessage.success('路由已更新')
    } else {
      await mockStore.createRoute(routeForm.value as MockRoute)
      ElMessage.success('路由已创建')
    }
    showRouteDialog.value = false
    resetRouteForm()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetRouteForm = () => {
  editingRoute.value = null
  routeForm.value = {
    method: 'GET',
    path: '',
    description: '',
    enabled: true,
    response: {
      statusCode: 200,
      headers: [],
      body: '',
      bodyType: 'json'
    },
    conditions: [],
    delay: 0
  }
}

const addHeader = () => {
  if (!routeForm.value.response) {
    routeForm.value.response = {
      statusCode: 200,
      headers: [],
      body: '',
      bodyType: 'json'
    }
  }
  if (!routeForm.value.response.headers) {
    routeForm.value.response.headers = []
  }
  routeForm.value.response.headers.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  if (routeForm.value.response?.headers) {
    routeForm.value.response.headers.splice(index, 1)
  }
}

const addCondition = () => {
  if (!routeForm.value.conditions) {
    routeForm.value.conditions = []
  }
  routeForm.value.conditions.push({
    type: 'query',
    field: '',
    operator: 'equals',
    value: ''
  })
}

const removeCondition = (index: number) => {
  if (routeForm.value.conditions) {
    routeForm.value.conditions.splice(index, 1)
  }
}

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    if (routeForm.value.response) {
      routeForm.value.response.body = e.target?.result as string
    }
  }
  reader.readAsText(file.raw)
}

const saveSettings = async () => {
  try {
    await mockStore.updateSettings(mockSettings.value)
    ElMessage.success('设置已保存')
    showSettings.value = false
  } catch (error) {
    ElMessage.error('保存设置失败')
  }
}

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？', '确认清空', {
      type: 'warning'
    })
    await mockStore.clearLogs()
    ElMessage.success('日志已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败')
    }
  }
}

const exportLogs = async () => {
  try {
    await mockStore.exportLogs()
    ElMessage.success('日志导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const exportRoutes = () => {
  const data = JSON.stringify(mockStore.routes, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mock-routes-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importRoutes = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const routes = JSON.parse(e.target?.result as string)
          await mockStore.importRoutes(routes)
          ElMessage.success('路由导入成功')
        } catch (error) {
          ElMessage.error('导入失败: 文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const viewLogDetail = (log: any) => {
  selectedLog.value = log
  showLogDetail.value = true
}

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

const getStatusType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400) return 'danger'
  return 'info'
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// Lifecycle
onMounted(async () => {
  await mockStore.loadRoutes()
  await mockStore.loadSettings()
  mockSettings.value = { ...mockStore.settings }
})

onUnmounted(() => {
  if (serverStatus.value === 'running') {
    mockStore.stopServer()
  }
})
</script>

<style scoped>
.mock-server-container {
  padding: 20px;
}

.mock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.mock-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.mock-title h2 {
  margin: 0;
}

.server-info {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-item .label {
  font-weight: 500;
  color: #666;
}

.routes-section,
.logs-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.headers-editor,
.conditions-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.header-row,
.condition-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.header-row:last-child,
.condition-row:last-child {
  margin-bottom: 0;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>