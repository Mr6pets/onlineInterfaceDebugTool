<template>
  <div class="history-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>历史记录</h1>
          <p>查看和管理所有API请求的历史记录，支持重新发送、保存为集合等操作</p>
        </div>
        <div class="header-actions">
          <el-button @click="clearAllHistory" type="danger" plain>
            <el-icon><Delete /></el-icon>
            清空历史
          </el-button>
          <el-button @click="exportHistory">
            <el-icon><Download /></el-icon>
            导出历史
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ successCount }}</div>
            <div class="stat-label">成功请求</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon error">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ errorCount }}</div>
            <div class="stat-label">失败请求</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon info">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ averageResponseTime }}ms</div>
            <div class="stat-label">平均响应时间</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><DocumentCopy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalRequests }}</div>
            <div class="stat-label">总请求数</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 过滤和搜索 -->
    <div class="filters-container">
      <div class="filters-content">
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索URL、方法或状态码"
            prefix-icon="Search"
            style="width: 300px;"
            clearable
          />
        </div>
        
        <div class="filter-section">
          <el-select
            v-model="selectedMethod"
            placeholder="请求方法"
            style="width: 120px;"
            clearable
          >
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="PATCH" value="PATCH" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
          
          <el-select
            v-model="selectedStatus"
            placeholder="状态码"
            style="width: 120px;"
            clearable
          >
            <el-option label="2xx 成功" value="2xx" />
            <el-option label="3xx 重定向" value="3xx" />
            <el-option label="4xx 客户端错误" value="4xx" />
            <el-option label="5xx 服务器错误" value="5xx" />
          </el-select>
          
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 350px;"
            clearable
          />
          
          <el-select
            v-model="selectedEnvironment"
            placeholder="环境"
            style="width: 150px;"
            clearable
          >
            <el-option
              v-for="env in environments"
              :key="env.id"
              :label="env.name"
              :value="env.id"
            />
          </el-select>
        </div>
        
        <div class="view-options">
          <el-button-group>
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
            <el-button
              :type="viewMode === 'timeline' ? 'primary' : 'default'"
              @click="viewMode = 'timeline'"
              size="small"
            >
              <el-icon><Clock /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-container">
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="history-list">
        <div class="list-header">
          <div class="bulk-actions" v-if="selectedItems.length > 0">
            <span class="selected-count">已选择 {{ selectedItems.length }} 项</span>
            <el-button @click="bulkSaveToCollection" size="small">
              <el-icon><FolderAdd /></el-icon>
              保存到集合
            </el-button>
            <el-button @click="bulkDelete" type="danger" size="small">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
          
          <div class="sort-options">
            <el-select v-model="sortBy" size="small" style="width: 150px;">
              <el-option label="时间（最新）" value="time_desc" />
              <el-option label="时间（最早）" value="time_asc" />
              <el-option label="响应时间" value="response_time" />
              <el-option label="状态码" value="status" />
            </el-select>
          </div>
        </div>
        
        <div class="history-items">
          <div
            v-for="item in filteredHistory"
            :key="item.id"
            class="history-item"
            :class="{ selected: selectedItems.includes(item.id) }"
          >
            <div class="item-checkbox">
              <el-checkbox
                :model-value="selectedItems.includes(item.id)"
                @change="toggleItemSelection(item.id)"
              />
            </div>
            
            <div class="item-method">
              <el-tag
                :type="getMethodTagType(item.method)"
                size="small"
                class="method-tag"
              >
                {{ item.method }}
              </el-tag>
            </div>
            
            <div class="item-url">
              <div class="url-text" :title="item.url">{{ item.url }}</div>
              <div class="url-meta">
                <span class="environment">{{ getEnvironmentName(item.environmentId) }}</span>
                <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
              </div>
            </div>
            
            <div class="item-status">
              <el-tag
                :type="getStatusTagType(item.status)"
                size="small"
                class="status-tag"
              >
                {{ item.status }}
              </el-tag>
            </div>
            
            <div class="item-response-time">
              <span class="response-time">{{ item.responseTime }}ms</span>
            </div>
            
            <div class="item-size">
              <span class="response-size">{{ formatSize(item.responseSize) }}</span>
            </div>
            
            <div class="item-actions">
              <el-button
                type="text"
                size="small"
                @click="viewDetails(item)"
                title="查看详情"
              >
                <el-icon><View /></el-icon>
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="resendRequest(item)"
                title="重新发送"
              >
                <el-icon><Refresh /></el-icon>
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="saveToCollection(item)"
                title="保存到集合"
              >
                <el-icon><FolderAdd /></el-icon>
              </el-button>
              <el-dropdown @command="(command) => handleItemAction(command, item)" trigger="click">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy">复制为cURL</el-dropdown-item>
                    <el-dropdown-item command="export">导出请求</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除记录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 时间线视图 -->
      <div v-else class="history-timeline">
        <div class="timeline-container">
          <div
            v-for="group in timelineGroups"
            :key="group.date"
            class="timeline-group"
          >
            <div class="timeline-date">
              <h3>{{ group.date }}</h3>
              <span class="group-count">{{ group.items.length }} 个请求</span>
            </div>
            
            <div class="timeline-items">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="timeline-item"
              >
                <div class="timeline-marker">
                  <div
                    class="marker-dot"
                    :class="getStatusClass(item.status)"
                  ></div>
                </div>
                
                <div class="timeline-content">
                  <div class="timeline-header">
                    <div class="request-info">
                      <el-tag
                        :type="getMethodTagType(item.method)"
                        size="small"
                        class="method-tag"
                      >
                        {{ item.method }}
                      </el-tag>
                      <span class="request-url">{{ item.url }}</span>
                    </div>
                    <div class="request-meta">
                      <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
                      <el-tag
                        :type="getStatusTagType(item.status)"
                        size="small"
                      >
                        {{ item.status }}
                      </el-tag>
                      <span class="response-time">{{ item.responseTime }}ms</span>
                    </div>
                  </div>
                  
                  <div class="timeline-actions">
                    <el-button type="text" size="small" @click="viewDetails(item)">
                      查看详情
                    </el-button>
                    <el-button type="text" size="small" @click="resendRequest(item)">
                      重新发送
                    </el-button>
                    <el-button type="text" size="small" @click="saveToCollection(item)">
                      保存到集合
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="totalItems"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="请求详情"
      width="80%"
      top="5vh"
    >
      <div v-if="selectedItem" class="request-details">
        <!-- 请求信息 -->
        <div class="details-section">
          <h3>请求信息</h3>
          <div class="request-summary">
            <div class="summary-item">
              <label>方法:</label>
              <el-tag :type="getMethodTagType(selectedItem.method)" size="small">
                {{ selectedItem.method }}
              </el-tag>
            </div>
            <div class="summary-item">
              <label>URL:</label>
              <span>{{ selectedItem.url }}</span>
            </div>
            <div class="summary-item">
              <label>状态码:</label>
              <el-tag :type="getStatusTagType(selectedItem.status)" size="small">
                {{ selectedItem.status }}
              </el-tag>
            </div>
            <div class="summary-item">
              <label>响应时间:</label>
              <span>{{ selectedItem.responseTime }}ms</span>
            </div>
            <div class="summary-item">
              <label>响应大小:</label>
              <span>{{ formatSize(selectedItem.responseSize) }}</span>
            </div>
            <div class="summary-item">
              <label>时间:</label>
              <span>{{ formatTime(selectedItem.timestamp) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 详细信息标签页 -->
        <el-tabs v-model="detailsActiveTab">
          <el-tab-pane label="请求头" name="request-headers">
            <div class="headers-list">
              <div
                v-for="(value, key) in selectedItem.requestHeaders"
                :key="key"
                class="header-item"
              >
                <div class="header-key">{{ key }}</div>
                <div class="header-value">{{ value }}</div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="请求体" name="request-body">
            <div class="request-body">
              <pre v-if="selectedItem.requestBody">{{ formatJson(selectedItem.requestBody) }}</pre>
              <div v-else class="empty-content">无请求体</div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="响应头" name="response-headers">
            <div class="headers-list">
              <div
                v-for="(value, key) in selectedItem.responseHeaders"
                :key="key"
                class="header-item"
              >
                <div class="header-key">{{ key }}</div>
                <div class="header-value">{{ value }}</div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="响应体" name="response-body">
            <div class="response-body">
              <div class="response-toolbar">
                <el-button-group>
                  <el-button
                    :type="responseViewMode === 'pretty' ? 'primary' : 'default'"
                    size="small"
                    @click="responseViewMode = 'pretty'"
                  >
                    Pretty
                  </el-button>
                  <el-button
                    :type="responseViewMode === 'raw' ? 'primary' : 'default'"
                    size="small"
                    @click="responseViewMode = 'raw'"
                  >
                    Raw
                  </el-button>
                </el-button-group>
                <el-button type="text" @click="copyResponse" size="small">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
              </div>
              <div class="response-content">
                <pre v-if="responseViewMode === 'pretty'">{{ formatJson(selectedItem.responseBody) }}</pre>
                <pre v-else>{{ selectedItem.responseBody }}</pre>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailsDialog = false">关闭</el-button>
          <el-button type="primary" @click="resendRequest(selectedItem)">
            <el-icon><Refresh /></el-icon>
            重新发送
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 保存到集合对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      title="保存到集合"
      width="500px"
    >
      <el-form
        ref="saveFormRef"
        :model="saveForm"
        :rules="saveFormRules"
        label-width="80px"
      >
        <el-form-item label="请求名称" prop="name">
          <el-input
            v-model="saveForm.name"
            placeholder="请输入请求名称"
          />
        </el-form-item>
        <el-form-item label="所属集合" prop="collectionId">
          <el-select v-model="saveForm.collectionId" placeholder="选择集合">
            <el-option
              v-for="collection in collections"
              :key="collection.id"
              :label="collection.name"
              :value="collection.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文件夹" prop="folderId">
          <el-select v-model="saveForm.folderId" placeholder="选择文件夹（可选）" clearable>
            <el-option
              v-for="folder in folders"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showSaveDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveToCollection" :loading="saving">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Delete,
  Download,
  CircleCheckFilled,
  CircleCloseFilled,
  Clock,
  DocumentCopy,
  List,
  FolderAdd,
  View,
  Refresh,
  MoreFilled,
  CopyDocument
} from '@element-plus/icons-vue'
// 临时本地类型定义
interface HistoryRecord {
  id: string
  request: any
  response?: any
  timestamp: Date
  duration: number
  status: 'success' | 'error'
}

interface Collection {
  id: string
  name: string
  requests: any[]
}

interface Environment {
  id: string
  name: string
  variables: any[]
  isActive: boolean
}

// 响应式数据
const searchQuery = ref('')
const selectedMethod = ref('')
const selectedStatus = ref('')
const selectedEnvironment = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const viewMode = ref('list')
const sortBy = ref('time_desc')
const currentPage = ref(1)
const pageSize = ref(50)
const selectedItems = ref<string[]>([])
const showDetailsDialog = ref(false)
const showSaveDialog = ref(false)
const selectedItem = ref<any>(null)
const detailsActiveTab = ref('request-headers')
const responseViewMode = ref('pretty')
const saving = ref(false)

// 表单引用
const saveFormRef = ref<FormInstance>()

// 保存表单
const saveForm = ref({
  name: '',
  collectionId: '',
  folderId: ''
})

// 模拟数据
const historyRecords = ref<HistoryRecord[]>([
  {
    id: '1',
    method: 'GET',
    url: 'https://api.example.com/users',
    status: 200,
    responseTime: 156,
    responseSize: 1024,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    environmentId: 'dev',
    requestHeaders: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    requestBody: null,
    responseHeaders: {
      'Content-Type': 'application/json',
      'Content-Length': '1024'
    },
    responseBody: JSON.stringify({
      success: true,
      data: [
        { id: 1, name: '用户1', email: 'user1@example.com' },
        { id: 2, name: '用户2', email: 'user2@example.com' }
      ]
    }, null, 2)
  },
  {
    id: '2',
    method: 'POST',
    url: 'https://api.example.com/users',
    status: 201,
    responseTime: 234,
    responseSize: 512,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    environmentId: 'dev',
    requestHeaders: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    requestBody: JSON.stringify({
      name: '新用户',
      email: 'newuser@example.com'
    }, null, 2),
    responseHeaders: {
      'Content-Type': 'application/json',
      'Location': '/users/3'
    },
    responseBody: JSON.stringify({
      success: true,
      data: { id: 3, name: '新用户', email: 'newuser@example.com' }
    }, null, 2)
  },
  {
    id: '3',
    method: 'GET',
    url: 'https://api.example.com/users/999',
    status: 404,
    responseTime: 89,
    responseSize: 256,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    environmentId: 'test',
    requestHeaders: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token456'
    },
    requestBody: null,
    responseHeaders: {
      'Content-Type': 'application/json'
    },
    responseBody: JSON.stringify({
      success: false,
      error: 'User not found'
    }, null, 2)
  }
])

const environments = ref<Environment[]>([
  {
    id: 'dev',
    name: '开发环境',
    variables: [],
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  },
  {
    id: 'test',
    name: '测试环境',
    variables: [],
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  }
])

const collections = ref<Collection[]>([
  {
    id: '1',
    name: '用户管理API',
    description: '用户相关接口',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1',
    workspaceId: '1'
  }
])

const folders = ref<any[]>([
  { id: '1', name: '用户接口', collectionId: '1' },
  { id: '2', name: '认证接口', collectionId: '1' }
])

// 表单验证规则
const saveFormRules: FormRules = {
  name: [
    { required: true, message: '请输入请求名称', trigger: 'blur' }
  ],
  collectionId: [
    { required: true, message: '请选择集合', trigger: 'change' }
  ]
}

// 计算属性
const filteredHistory = computed(() => {
  let filtered = historyRecords.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.url.toLowerCase().includes(query) ||
      item.method.toLowerCase().includes(query) ||
      item.status.toString().includes(query)
    )
  }
  
  // 方法过滤
  if (selectedMethod.value) {
    filtered = filtered.filter(item => item.method === selectedMethod.value)
  }
  
  // 状态码过滤
  if (selectedStatus.value) {
    const statusRange = selectedStatus.value
    filtered = filtered.filter(item => {
      const status = item.status
      switch (statusRange) {
        case '2xx': return status >= 200 && status < 300
        case '3xx': return status >= 300 && status < 400
        case '4xx': return status >= 400 && status < 500
        case '5xx': return status >= 500
        default: return true
      }
    })
  }
  
  // 环境过滤
  if (selectedEnvironment.value) {
    filtered = filtered.filter(item => item.environmentId === selectedEnvironment.value)
  }
  
  // 时间范围过滤
  if (dateRange.value) {
    const [start, end] = dateRange.value
    filtered = filtered.filter(item => 
      item.timestamp >= start && item.timestamp <= end
    )
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'time_desc':
        return b.timestamp.getTime() - a.timestamp.getTime()
      case 'time_asc':
        return a.timestamp.getTime() - b.timestamp.getTime()
      case 'response_time':
        return b.responseTime - a.responseTime
      case 'status':
        return a.status - b.status
      default:
        return 0
    }
  })
  
  return filtered
})

const timelineGroups = computed(() => {
  const groups: Record<string, any[]> = {}
  
  filteredHistory.value.forEach(item => {
    const date = item.timestamp.toLocaleDateString('zh-CN')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  })
  
  return Object.entries(groups).map(([date, items]) => ({
    date,
    items
  }))
})

const totalItems = computed(() => filteredHistory.value.length)

const successCount = computed(() => 
  historyRecords.value.filter(item => item.status >= 200 && item.status < 300).length
)

const errorCount = computed(() => 
  historyRecords.value.filter(item => item.status >= 400).length
)

const averageResponseTime = computed(() => {
  const total = historyRecords.value.reduce((sum, item) => sum + item.responseTime, 0)
  return Math.round(total / historyRecords.value.length) || 0
})

const totalRequests = computed(() => historyRecords.value.length)

// 方法
const getMethodTagType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    PATCH: 'info',
    DELETE: 'danger'
  }
  return types[method] || 'info'
}

const getStatusTagType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'error'
  return 'default'
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

const formatJson = (data: string) => {
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

const getEnvironmentName = (environmentId: string) => {
  const env = environments.value.find(e => e.id === environmentId)
  return env?.name || '未知环境'
}

const toggleItemSelection = (itemId: string) => {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(itemId)
  }
}

const viewDetails = (item: HistoryRecord) => {
  selectedItem.value = item
  showDetailsDialog.value = true
}

const resendRequest = (item: HistoryRecord) => {
  ElMessage.success('请求已重新发送')
  // 这里应该调用API发送请求的逻辑
}

const saveToCollection = (item: HistoryRecord) => {
  selectedItem.value = item
  saveForm.value.name = `${item.method} ${item.url.split('/').pop() || 'Request'}`
  showSaveDialog.value = true
}

const handleItemAction = async (command: string, item: HistoryRecord) => {
  switch (command) {
    case 'copy':
      await copyAsCurl(item)
      break
    case 'export':
      await exportRequest(item)
      break
    case 'delete':
      await deleteHistoryItem(item)
      break
  }
}

const copyAsCurl = async (item: HistoryRecord) => {
  const curl = generateCurlCommand(item)
  try {
    await navigator.clipboard.writeText(curl)
    ElMessage.success('cURL命令已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const generateCurlCommand = (item: HistoryRecord) => {
  let curl = `curl -X ${item.method} "${item.url}"`
  
  // 添加请求头
  Object.entries(item.requestHeaders || {}).forEach(([key, value]) => {
    curl += ` -H "${key}: ${value}"`
  })
  
  // 添加请求体
  if (item.requestBody) {
    curl += ` -d '${item.requestBody}'`
  }
  
  return curl
}

const exportRequest = async (item: HistoryRecord) => {
  const data = {
    method: item.method,
    url: item.url,
    headers: item.requestHeaders,
    body: item.requestBody,
    timestamp: item.timestamp.toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `request_${item.id}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('请求已导出')
}

const deleteHistoryItem = async (item: HistoryRecord) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条历史记录吗？',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = historyRecords.value.findIndex(record => record.id === item.id)
    if (index > -1) {
      historyRecords.value.splice(index, 1)
    }
    
    ElMessage.success('历史记录已删除')
  } catch (error) {
    // 用户取消删除
  }
}

const bulkSaveToCollection = () => {
  ElMessage.info('批量保存到集合功能开发中')
}

const bulkDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedItems.value.length} 条历史记录吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    selectedItems.value.forEach(itemId => {
      const index = historyRecords.value.findIndex(record => record.id === itemId)
      if (index > -1) {
        historyRecords.value.splice(index, 1)
      }
    })
    
    selectedItems.value = []
    ElMessage.success('批量删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const clearAllHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    historyRecords.value = []
    selectedItems.value = []
    ElMessage.success('历史记录已清空')
  } catch (error) {
    // 用户取消清空
  }
}

const exportHistory = () => {
  const data = historyRecords.value.map(item => ({
    method: item.method,
    url: item.url,
    status: item.status,
    responseTime: item.responseTime,
    timestamp: item.timestamp.toISOString(),
    environmentId: item.environmentId
  }))
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `history_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('历史记录已导出')
}

const handleSaveToCollection = async () => {
  if (!saveFormRef.value) return
  
  try {
    await saveFormRef.value.validate()
    saving.value = true
    
    // 模拟保存到集合
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showSaveDialog.value = false
    resetSaveForm()
    ElMessage.success('请求已保存到集合')
  } catch (error) {
    console.error('Failed to save to collection:', error)
  } finally {
    saving.value = false
  }
}

const copyResponse = async () => {
  if (!selectedItem.value) return
  
  try {
    await navigator.clipboard.writeText(selectedItem.value.responseBody)
    ElMessage.success('响应内容已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const resetSaveForm = () => {
  saveForm.value = {
    name: '',
    collectionId: '',
    folderId: ''
  }
  saveFormRef.value?.resetFields()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.history-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-left p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-container {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.success {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.error {
  background: #fef2f2;
  color: #dc2626;
}

.stat-icon.info {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.primary {
  background: #f0f9ff;
  color: #0ea5e9;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.filters-container {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
}

.filters-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.filter-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.history-container {
  flex: 1;
  overflow: hidden;
  padding: 24px;
}

.history-list {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.list-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
}

.history-items {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.history-item {
  display: grid;
  grid-template-columns: 40px 80px 1fr 80px 100px 80px 120px;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  transition: background-color 0.2s;
}

.history-item:hover {
  background: #f9fafb;
}

.history-item.selected {
  background: #eff6ff;
}

.history-item:last-child {
  border-bottom: none;
}

.item-url {
  min-width: 0;
}

.url-text {
  font-size: 14px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.url-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.method-tag {
  font-size: 10px;
  padding: 2px 6px;
  min-width: 50px;
  text-align: center;
}

.status-tag {
  font-size: 12px;
  padding: 2px 6px;
}

.response-time,
.response-size {
  font-size: 12px;
  color: #6b7280;
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .item-actions {
  opacity: 1;
}

.history-timeline {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.timeline-group {
  margin-bottom: 32px;
}

.timeline-date {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.timeline-date h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.group-count {
  font-size: 12px;
  color: #6b7280;
}

.timeline-items {
  position: relative;
  padding-left: 24px;
}

.timeline-items::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
}

.timeline-marker {
  position: absolute;
  left: -20px;
  top: 8px;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #e5e7eb;
}

.marker-dot.success {
  background: #16a34a;
}

.marker-dot.error {
  background: #dc2626;
}

.marker-dot.warning {
  background: #f59e0b;
}

.marker-dot.info {
  background: #2563eb;
}

.timeline-content {
  flex: 1;
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.request-url {
  font-size: 14px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.request-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.timeline-actions {
  display: flex;
  gap: 8px;
}

.pagination-container {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  justify-content: center;
}

.request-details {
  max-height: 70vh;
  overflow-y: auto;
}

.details-section {
  margin-bottom: 24px;
}

.details-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.request-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.headers-list {
  max-height: 300px;
  overflow-y: auto;
}

.header-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.header-item:last-child {
  border-bottom: none;
}

.header-key {
  width: 200px;
  font-weight: 600;
  color: #1f2937;
  margin-right: 16px;
}

.header-value {
  flex: 1;
  color: #6b7280;
  word-break: break-all;
}

.request-body,
.response-body {
  max-height: 400px;
  overflow-y: auto;
}

.response-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.response-content {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.response-content pre {
  margin: 0;
  padding: 16px;
  background: #f9fafb;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-content {
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1024px) {
  .filters-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .filter-section {
    flex-wrap: wrap;
  }
  
  .history-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .timeline-header {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .request-summary {
    grid-template-columns: 1fr;
  }
}
</style>