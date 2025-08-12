<template>
  <div class="api-debugger">
    <!-- 左侧集合树 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>API集合</h3>
        <div class="header-actions">
          <el-button type="text" @click="showCreateRequestDialog = true">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button type="text" @click="refreshCollections">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索API"
          prefix-icon="Search"
          size="small"
          clearable
        />
      </div>

      <div class="collections-tree">
        <el-tree
          ref="treeRef"
          :data="filteredTreeData"
          :props="treeProps"
          node-key="id"
          :expand-on-click-node="false"
          :highlight-current="true"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <div class="node-content">
                <el-icon class="node-icon">
                  <Folder v-if="data.type === 'collection'" />
                  <FolderOpened v-else-if="data.type === 'folder'" />
                  <Document v-else />
                </el-icon>
                <span class="node-label">{{ data.label }}</span>
                <el-tag
                  v-if="data.type === 'request'"
                  :type="getMethodTagType(data.method)"
                  size="small"
                  class="method-tag"
                >
                  {{ data.method }}
                </el-tag>
              </div>
              <div class="node-actions">
                <el-dropdown
                  @command="(command) => handleNodeAction(command, data)"
                  trigger="click"
                  @click.stop
                >
                  <el-button type="text" size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="data.type === 'collection'" command="addFolder">
                        添加文件夹
                      </el-dropdown-item>
                      <el-dropdown-item v-if="data.type !== 'request'" command="addRequest">
                        添加请求
                      </el-dropdown-item>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="duplicate" v-if="data.type === 'request'">
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 标签页 -->
      <div class="tabs-container">
        <el-tabs
          v-model="activeTab"
          type="card"
          closable
          @tab-remove="closeTab"
          @tab-click="switchTab"
        >
          <el-tab-pane
            v-for="tab in openTabs"
            :key="tab.id"
            :label="tab.name"
            :name="tab.id"
          >
            <template #label>
              <div class="tab-label">
                <el-tag
                  v-if="tab.method"
                  :type="getMethodTagType(tab.method)"
                  size="small"
                  class="tab-method"
                >
                  {{ tab.method }}
                </el-tag>
                <span>{{ tab.name }}</span>
                <el-icon v-if="tab.modified" class="modified-indicator"><WarningFilled /></el-icon>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 请求编辑器 -->
      <div v-if="currentRequest" class="request-editor">
        <!-- 请求基本信息 -->
        <div class="request-header">
          <div class="request-line">
            <el-select
              v-model="currentRequest.method"
              style="width: 120px;"
              @change="markAsModified"
            >
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="PATCH" value="PATCH" />
              <el-option label="DELETE" value="DELETE" />
              <el-option label="HEAD" value="HEAD" />
              <el-option label="OPTIONS" value="OPTIONS" />
            </el-select>
            <el-input
              v-model="currentRequest.url"
              placeholder="请输入请求URL"
              class="url-input"
              @input="markAsModified"
            >
              <template #prepend>
                <el-select v-model="selectedEnvironment" style="width: 120px;">
                  <el-option label="无环境" value="" />
                  <el-option
                    v-for="env in environments"
                    :key="env.id"
                    :label="env.name"
                    :value="env.id"
                  />
                </el-select>
              </template>
            </el-input>
            <el-button
              type="primary"
              @click="sendRequest"
              :loading="sending"
              class="send-btn"
            >
              发送
            </el-button>
          </div>
          <div class="request-meta">
            <el-input
              v-model="currentRequest.name"
              placeholder="请求名称"
              size="small"
              style="width: 200px;"
              @input="markAsModified"
            />
            <el-button @click="saveRequest" :loading="saving" size="small">
              <el-icon><DocumentCopy /></el-icon>
              保存
            </el-button>
          </div>
        </div>

        <!-- 请求详情 -->
        <div class="request-details">
          <el-tabs v-model="requestActiveTab" class="request-tabs">
            <!-- 参数 -->
            <el-tab-pane label="参数" name="params">
              <div class="params-section">
                <div class="section-header">
                  <h4>Query参数</h4>
                  <el-button type="text" @click="addParam">
                    <el-icon><Plus /></el-icon>
                    添加参数
                  </el-button>
                </div>
                <div class="params-table">
                  <div class="param-row header-row">
                    <div class="param-checkbox"></div>
                    <div class="param-key">键</div>
                    <div class="param-value">值</div>
                    <div class="param-description">描述</div>
                    <div class="param-actions"></div>
                  </div>
                  <div
                    v-for="(param, index) in currentRequest.params"
                    :key="index"
                    class="param-row"
                  >
                    <div class="param-checkbox">
                      <el-checkbox v-model="param.enabled" @change="markAsModified" />
                    </div>
                    <div class="param-key">
                      <el-input
                        v-model="param.key"
                        placeholder="参数名"
                        size="small"
                        @input="markAsModified"
                      />
                    </div>
                    <div class="param-value">
                      <el-input
                        v-model="param.value"
                        placeholder="参数值"
                        size="small"
                        @input="markAsModified"
                      />
                    </div>
                    <div class="param-description">
                      <el-input
                        v-model="param.description"
                        placeholder="描述"
                        size="small"
                        @input="markAsModified"
                      />
                    </div>
                    <div class="param-actions">
                      <el-button
                        type="text"
                        size="small"
                        @click="removeParam(index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 请求头 -->
            <el-tab-pane label="请求头" name="headers">
              <div class="headers-section">
                <div class="section-header">
                  <h4>请求头</h4>
                  <el-button type="text" @click="addHeader">
                    <el-icon><Plus /></el-icon>
                    添加请求头
                  </el-button>
                </div>
                <div class="headers-table">
                  <div class="header-row header-row">
                    <div class="header-checkbox"></div>
                    <div class="header-key">键</div>
                    <div class="header-value">值</div>
                    <div class="header-description">描述</div>
                    <div class="header-actions"></div>
                  </div>
                  <div
                    v-for="(header, index) in currentRequest.headers"
                    :key="index"
                    class="header-row"
                  >
                    <div class="header-checkbox">
                      <el-checkbox v-model="header.enabled" @change="markAsModified" />
                    </div>
                    <div class="header-key">
                      <el-input
                        v-model="header.key"
                        placeholder="请求头名称"
                        size="small"
                        @input="markAsModified"
                      />
                    </div>
                    <div class="header-value">
                      <el-input
                        v-model="header.value"
                        placeholder="请求头值"
                        size="small"
                        @input="markAsModified"
                      />
                    </div>
                    <div class="header-description">
                      <el-input
                        v-model="header.description"
                        placeholder="描述"
                        size="small"
                        @input="markAsModified"
                      />
                    </div>
                    <div class="header-actions">
                      <el-button
                        type="text"
                        size="small"
                        @click="removeHeader(index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 请求体 -->
            <el-tab-pane label="请求体" name="body">
              <div class="body-section">
                <div class="body-type-selector">
                  <el-radio-group v-model="currentRequest.bodyType" @change="markAsModified">
                    <el-radio-button label="none">无</el-radio-button>
                    <el-radio-button label="form-data">form-data</el-radio-button>
                    <el-radio-button label="x-www-form-urlencoded">x-www-form-urlencoded</el-radio-button>
                    <el-radio-button label="raw">raw</el-radio-button>
                    <el-radio-button label="binary">binary</el-radio-button>
                  </el-radio-group>
                </div>

                <!-- form-data -->
                <div v-if="currentRequest.bodyType === 'form-data'" class="form-data-section">
                  <div class="section-header">
                    <h4>Form Data</h4>
                    <el-button type="text" @click="addFormData">
                      <el-icon><Plus /></el-icon>
                      添加字段
                    </el-button>
                  </div>
                  <div class="form-data-table">
                    <div class="form-data-row header-row">
                      <div class="form-data-checkbox"></div>
                      <div class="form-data-key">键</div>
                      <div class="form-data-type">类型</div>
                      <div class="form-data-value">值</div>
                      <div class="form-data-actions"></div>
                    </div>
                    <div
                      v-for="(item, index) in currentRequest.formData"
                      :key="index"
                      class="form-data-row"
                    >
                      <div class="form-data-checkbox">
                        <el-checkbox v-model="item.enabled" @change="markAsModified" />
                      </div>
                      <div class="form-data-key">
                        <el-input
                          v-model="item.key"
                          placeholder="字段名"
                          size="small"
                          @input="markAsModified"
                        />
                      </div>
                      <div class="form-data-type">
                        <el-select v-model="item.type" size="small" @change="markAsModified">
                          <el-option label="Text" value="text" />
                          <el-option label="File" value="file" />
                        </el-select>
                      </div>
                      <div class="form-data-value">
                        <el-input
                          v-if="item.type === 'text'"
                          v-model="item.value"
                          placeholder="字段值"
                          size="small"
                          @input="markAsModified"
                        />
                        <el-upload
                          v-else
                          :auto-upload="false"
                          :show-file-list="false"
                          @change="(file) => handleFileChange(file, item)"
                        >
                          <el-button size="small">选择文件</el-button>
                        </el-upload>
                      </div>
                      <div class="form-data-actions">
                        <el-button
                          type="text"
                          size="small"
                          @click="removeFormData(index)"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- raw -->
                <div v-else-if="currentRequest.bodyType === 'raw'" class="raw-section">
                  <div class="raw-header">
                    <el-select v-model="currentRequest.rawType" size="small" @change="markAsModified">
                      <el-option label="Text" value="text" />
                      <el-option label="JavaScript" value="javascript" />
                      <el-option label="JSON" value="json" />
                      <el-option label="HTML" value="html" />
                      <el-option label="XML" value="xml" />
                    </el-select>
                    <el-button type="text" @click="formatRawBody" size="small">
                      <el-icon><MagicStick /></el-icon>
                      格式化
                    </el-button>
                  </div>
                  <div class="raw-editor">
                    <el-input
                      v-model="currentRequest.rawBody"
                      type="textarea"
                      :rows="12"
                      placeholder="请输入请求体内容"
                      @input="markAsModified"
                    />
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 认证 -->
            <el-tab-pane label="认证" name="auth">
              <div class="auth-section">
                <div class="auth-type-selector">
                  <el-select v-model="currentRequest.authType" placeholder="选择认证类型" @change="markAsModified">
                    <el-option label="无认证" value="none" />
                    <el-option label="Bearer Token" value="bearer" />
                    <el-option label="Basic Auth" value="basic" />
                    <el-option label="API Key" value="apikey" />
                    <el-option label="OAuth 2.0" value="oauth2" />
                  </el-select>
                </div>

                <!-- Bearer Token -->
                <div v-if="currentRequest.authType === 'bearer'" class="auth-config">
                  <el-form label-width="100px">
                    <el-form-item label="Token">
                      <el-input
                        v-model="currentRequest.auth.token"
                        placeholder="请输入Bearer Token"
                        @input="markAsModified"
                      />
                    </el-form-item>
                  </el-form>
                </div>

                <!-- Basic Auth -->
                <div v-else-if="currentRequest.authType === 'basic'" class="auth-config">
                  <el-form label-width="100px">
                    <el-form-item label="用户名">
                      <el-input
                        v-model="currentRequest.auth.username"
                        placeholder="请输入用户名"
                        @input="markAsModified"
                      />
                    </el-form-item>
                    <el-form-item label="密码">
                      <el-input
                        v-model="currentRequest.auth.password"
                        type="password"
                        placeholder="请输入密码"
                        show-password
                        @input="markAsModified"
                      />
                    </el-form-item>
                  </el-form>
                </div>

                <!-- API Key -->
                <div v-else-if="currentRequest.authType === 'apikey'" class="auth-config">
                  <el-form label-width="100px">
                    <el-form-item label="Key">
                      <el-input
                        v-model="currentRequest.auth.key"
                        placeholder="API Key名称"
                        @input="markAsModified"
                      />
                    </el-form-item>
                    <el-form-item label="Value">
                      <el-input
                        v-model="currentRequest.auth.value"
                        placeholder="API Key值"
                        @input="markAsModified"
                      />
                    </el-form-item>
                    <el-form-item label="添加到">
                      <el-radio-group v-model="currentRequest.auth.addTo" @change="markAsModified">
                        <el-radio label="header">Header</el-radio>
                        <el-radio label="query">Query Params</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </el-tab-pane>

            <!-- 测试脚本 -->
            <el-tab-pane label="测试" name="tests">
              <div class="tests-section">
                <div class="section-header">
                  <h4>测试脚本</h4>
                  <el-button type="text" @click="insertTestTemplate">
                    <el-icon><Plus /></el-icon>
                    插入模板
                  </el-button>
                </div>
                <div class="tests-editor">
                  <el-input
                    v-model="currentRequest.tests"
                    type="textarea"
                    :rows="10"
                    placeholder="// 编写测试脚本\npm.test('Status code is 200', function () {\n    pm.response.to.have.status(200);\n});"
                    @input="markAsModified"
                  />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 响应区域 -->
      <div v-if="response" class="response-section">
        <div class="response-header">
          <h3>响应</h3>
          <div class="response-meta">
            <el-tag :type="getStatusTagType(response.status)" class="status-tag">
              {{ response.status }} {{ response.statusText }}
            </el-tag>
            <span class="response-time">{{ response.time }}ms</span>
            <span class="response-size">{{ formatSize(response.size) }}</span>
          </div>
        </div>

        <el-tabs v-model="responseActiveTab" class="response-tabs">
          <!-- 响应体 -->
          <el-tab-pane label="响应体" name="body">
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
                  <el-button
                    :type="responseViewMode === 'preview' ? 'primary' : 'default'"
                    size="small"
                    @click="responseViewMode = 'preview'"
                  >
                    Preview
                  </el-button>
                </el-button-group>
                <el-button type="text" @click="copyResponse" size="small">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
              </div>
              <div class="response-content">
                <pre v-if="responseViewMode === 'pretty'" class="pretty-json">{{ formatJson(response.data) }}</pre>
                <pre v-else-if="responseViewMode === 'raw'" class="raw-text">{{ response.data }}</pre>
                <iframe v-else-if="responseViewMode === 'preview'" :srcdoc="response.data" class="preview-frame"></iframe>
              </div>
            </div>
          </el-tab-pane>

          <!-- 响应头 -->
          <el-tab-pane label="响应头" name="headers">
            <div class="response-headers">
              <div class="header-item" v-for="(value, key) in response.headers" :key="key">
                <div class="header-key">{{ key }}</div>
                <div class="header-value">{{ value }}</div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 测试结果 -->
          <el-tab-pane label="测试结果" name="test-results">
            <div class="test-results">
              <div v-if="testResults.length === 0" class="no-tests">
                <el-empty description="暂无测试结果" />
              </div>
              <div v-else class="test-list">
                <div
                  v-for="(test, index) in testResults"
                  :key="index"
                  class="test-item"
                  :class="{ passed: test.passed, failed: !test.passed }"
                >
                  <el-icon class="test-icon">
                    <CircleCheckFilled v-if="test.passed" />
                    <CircleCloseFilled v-else />
                  </el-icon>
                  <div class="test-content">
                    <div class="test-name">{{ test.name }}</div>
                    <div v-if="!test.passed" class="test-error">{{ test.error }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!currentRequest" class="empty-state">
        <el-empty description="选择一个API请求开始调试" />
      </div>
    </div>

    <!-- 创建请求对话框 -->
    <el-dialog
      v-model="showCreateRequestDialog"
      title="创建新请求"
      width="500px"
    >
      <el-form
        ref="createRequestFormRef"
        :model="createRequestForm"
        :rules="createRequestFormRules"
        label-width="80px"
      >
        <el-form-item label="请求名称" prop="name">
          <el-input
            v-model="createRequestForm.name"
            placeholder="请输入请求名称"
          />
        </el-form-item>
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="createRequestForm.method">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="PATCH" value="PATCH" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求URL" prop="url">
          <el-input
            v-model="createRequestForm.url"
            placeholder="https://api.example.com/endpoint"
          />
        </el-form-item>
        <el-form-item label="所属集合" prop="collectionId">
          <el-select v-model="createRequestForm.collectionId">
            <el-option
              v-for="collection in collections"
              :key="collection.id"
              :label="collection.name"
              :value="collection.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateRequestDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateRequest" :loading="creating">
            创建请求
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import {
  Plus,
  Refresh,
  Folder,
  FolderOpened,
  Document,
  MoreFilled,
  Delete,
  DocumentCopy,
  MagicStick,
  CopyDocument,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { useCollectionStore } from '@/stores/collection'
import { useEnvironmentStore } from '@/stores/environment'
// 临时本地类型定义
interface Collection {
  id: string
  name: string
  description?: string
  requests: ApiRequest[]
}

interface ApiRequest {
  id: string
  name: string
  method: string
  url: string
  headers?: Record<string, string>
  params?: Record<string, string>
  body?: any
}

interface Environment {
  id: string
  name: string
  variables: any[]
  isActive: boolean
}

const collectionStore = useCollectionStore()
const environmentStore = useEnvironmentStore()

// 响应式数据
const searchQuery = ref('')
const activeTab = ref('')
const requestActiveTab = ref('params')
const responseActiveTab = ref('body')
const responseViewMode = ref('pretty')
const selectedEnvironment = ref('')
const sending = ref(false)
const saving = ref(false)
const creating = ref(false)
const showCreateRequestDialog = ref(false)

// 表单引用
const treeRef = ref()
const createRequestFormRef = ref<FormInstance>()

// 打开的标签页
const openTabs = ref<any[]>([])

// 当前请求
const currentRequest = ref<any>(null)

// 响应数据
const response = ref<any>(null)

// 测试结果
const testResults = ref<any[]>([])

// 创建请求表单
const createRequestForm = ref({
  name: '',
  method: 'GET',
  url: '',
  collectionId: ''
})

// 模拟数据
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

const environments = ref<Environment[]>([
  {
    id: '1',
    name: '开发环境',
    variables: [{ key: 'baseUrl', value: 'https://dev-api.example.com' }],
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  }
])

// 树形数据
const treeData = ref([
  {
    id: '1',
    label: '用户管理API',
    type: 'collection',
    children: [
      {
        id: '1-1',
        label: '用户注册',
        type: 'request',
        method: 'POST',
        url: '/api/users/register'
      },
      {
        id: '1-2',
        label: '用户登录',
        type: 'request',
        method: 'POST',
        url: '/api/users/login'
      },
      {
        id: '1-3',
        label: '获取用户信息',
        type: 'request',
        method: 'GET',
        url: '/api/users/profile'
      }
    ]
  }
])

const treeProps = {
  children: 'children',
  label: 'label'
}

// 表单验证规则
const createRequestFormRules: FormRules = {
  name: [
    { required: true, message: '请输入请求名称', trigger: 'blur' }
  ],
  method: [
    { required: true, message: '请选择请求方法', trigger: 'change' }
  ],
  url: [
    { required: true, message: '请输入请求URL', trigger: 'blur' }
  ],
  collectionId: [
    { required: true, message: '请选择所属集合', trigger: 'change' }
  ]
}

// 计算属性
const filteredTreeData = computed(() => {
  if (!searchQuery.value) return treeData.value
  
  const filterTree = (nodes: any[]): any[] => {
    return nodes.reduce((filtered: any[], node: any) => {
      const matchesSearch = node.label.toLowerCase().includes(searchQuery.value.toLowerCase())
      const children = node.children ? filterTree(node.children) : []
      
      if (matchesSearch || children.length > 0) {
        filtered.push({
          ...node,
          children: children.length > 0 ? children : node.children
        })
      }
      
      return filtered
    }, [])
  }
  
  return filterTree(treeData.value)
})

// 方法
const getMethodTagType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    PATCH: 'info',
    DELETE: 'danger',
    HEAD: 'info',
    OPTIONS: 'info'
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

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatJson = (data: any) => {
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

const handleNodeClick = (data: any) => {
  if (data.type === 'request') {
    openRequest(data)
  }
}

const handleNodeAction = async (command: string, data: any) => {
  switch (command) {
    case 'addFolder':
      ElMessage.info('添加文件夹功能开发中')
      break
    case 'addRequest':
      createRequestForm.value.collectionId = data.id
      showCreateRequestDialog.value = true
      break
    case 'rename':
      ElMessage.info('重命名功能开发中')
      break
    case 'duplicate':
      ElMessage.info('复制功能开发中')
      break
    case 'delete':
      await handleDeleteNode(data)
      break
  }
}

const handleDeleteNode = async (data: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${data.label}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const openRequest = (requestData: any) => {
  // 检查是否已经打开
  const existingTab = openTabs.value.find(tab => tab.id === requestData.id)
  if (existingTab) {
    activeTab.value = requestData.id
    return
  }
  
  // 创建新标签页
  const newTab = {
    id: requestData.id,
    name: requestData.label,
    method: requestData.method,
    modified: false
  }
  
  openTabs.value.push(newTab)
  activeTab.value = requestData.id
  
  // 加载请求数据
  loadRequest(requestData)
}

const loadRequest = (requestData: any) => {
  currentRequest.value = {
    id: requestData.id,
    name: requestData.label,
    method: requestData.method,
    url: requestData.url,
    params: [
      { key: '', value: '', description: '', enabled: true }
    ],
    headers: [
      { key: 'Content-Type', value: 'application/json', description: '', enabled: true }
    ],
    bodyType: 'none',
    formData: [],
    rawBody: '',
    rawType: 'json',
    authType: 'none',
    auth: {},
    tests: ''
  }
}

const closeTab = (tabId: string) => {
  const index = openTabs.value.findIndex(tab => tab.id === tabId)
  if (index > -1) {
    openTabs.value.splice(index, 1)
    
    // 如果关闭的是当前标签页，切换到其他标签页
    if (activeTab.value === tabId) {
      if (openTabs.value.length > 0) {
        activeTab.value = openTabs.value[Math.max(0, index - 1)].id
        // 加载对应的请求数据
      } else {
        activeTab.value = ''
        currentRequest.value = null
      }
    }
  }
}

const switchTab = (tab: any) => {
  activeTab.value = tab.paneName
  // 加载对应的请求数据
}

const markAsModified = () => {
  const tab = openTabs.value.find(tab => tab.id === activeTab.value)
  if (tab) {
    tab.modified = true
  }
}

const addParam = () => {
  currentRequest.value.params.push({
    key: '',
    value: '',
    description: '',
    enabled: true
  })
  markAsModified()
}

const removeParam = (index: number) => {
  currentRequest.value.params.splice(index, 1)
  markAsModified()
}

const addHeader = () => {
  currentRequest.value.headers.push({
    key: '',
    value: '',
    description: '',
    enabled: true
  })
  markAsModified()
}

const removeHeader = (index: number) => {
  currentRequest.value.headers.splice(index, 1)
  markAsModified()
}

const addFormData = () => {
  currentRequest.value.formData.push({
    key: '',
    value: '',
    type: 'text',
    enabled: true
  })
  markAsModified()
}

const removeFormData = (index: number) => {
  currentRequest.value.formData.splice(index, 1)
  markAsModified()
}

const handleFileChange = (file: UploadFile, item: any) => {
  item.value = file.name
  item.file = file.raw
  markAsModified()
}

const formatRawBody = () => {
  if (currentRequest.value.rawType === 'json') {
    try {
      const parsed = JSON.parse(currentRequest.value.rawBody)
      currentRequest.value.rawBody = JSON.stringify(parsed, null, 2)
      markAsModified()
    } catch (error) {
      ElMessage.error('JSON格式错误')
    }
  }
}

const insertTestTemplate = () => {
  const template = `// 状态码测试
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

// 响应时间测试
pm.test('Response time is less than 200ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});

// 响应体测试
pm.test('Response has required fields', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});`
  
  currentRequest.value.tests = template
  markAsModified()
}

const sendRequest = async () => {
  if (!currentRequest.value) return
  
  sending.value = true
  try {
    // 模拟发送请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟响应数据
    response.value = {
      status: 200,
      statusText: 'OK',
      time: 156,
      size: 1024,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '1024',
        'Date': new Date().toISOString()
      },
      data: JSON.stringify({
        success: true,
        message: '请求成功',
        data: {
          id: 1,
          name: '测试用户',
          email: 'test@example.com'
        }
      }, null, 2)
    }
    
    // 运行测试脚本（模拟）
    if (currentRequest.value.tests) {
      testResults.value = [
        { name: 'Status code is 200', passed: true },
        { name: 'Response time is less than 200ms', passed: true },
        { name: 'Response has required fields', passed: true }
      ]
    }
    
    ElMessage.success('请求发送成功')
  } catch (error) {
    ElMessage.error('请求发送失败')
  } finally {
    sending.value = false
  }
}

const saveRequest = async () => {
  if (!currentRequest.value) return
  
  saving.value = true
  try {
    await collectionStore.saveRequest(currentRequest.value)
    
    // 标记为未修改
    const tab = openTabs.value.find(tab => tab.id === activeTab.value)
    if (tab) {
      tab.modified = false
    }
    
    ElMessage.success('请求保存成功')
  } catch (error) {
    ElMessage.error('保存请求失败')
  } finally {
    saving.value = false
  }
}

const handleCreateRequest = async () => {
  if (!createRequestFormRef.value) return
  
  try {
    await createRequestFormRef.value.validate()
    creating.value = true
    
    const newRequest = await collectionStore.createRequest(createRequestForm.value)
    
    showCreateRequestDialog.value = false
    resetCreateRequestForm()
    ElMessage.success('请求创建成功')
    
    // 刷新树形数据
    await refreshCollections()
  } catch (error) {
    console.error('Failed to create request:', error)
  } finally {
    creating.value = false
  }
}

const copyResponse = async () => {
  if (!response.value) return
  
  try {
    await navigator.clipboard.writeText(response.value.data)
    ElMessage.success('响应内容已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const refreshCollections = async () => {
  try {
    await collectionStore.loadCollections()
    // 更新树形数据
  } catch (error) {
    ElMessage.error('刷新集合失败')
  }
}

const resetCreateRequestForm = () => {
  createRequestForm.value = {
    name: '',
    method: 'GET',
    url: '',
    collectionId: ''
  }
  createRequestFormRef.value?.resetFields()
}

// 生命周期
onMounted(() => {
  refreshCollections()
})
</script>

<style scoped>
.api-debugger {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.search-box {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.collections-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
}

.tree-node:hover {
  background: #f3f4f6;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.node-icon {
  font-size: 14px;
  color: #6b7280;
}

.node-label {
  font-size: 14px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.method-tag {
  font-size: 10px;
  padding: 2px 4px;
  min-width: 40px;
  text-align: center;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-container {
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-method {
  font-size: 10px;
  padding: 2px 4px;
}

.modified-indicator {
  font-size: 8px;
  color: #f59e0b;
}

.request-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.request-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.request-line {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.url-input {
  flex: 1;
}

.send-btn {
  min-width: 80px;
}

.request-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.request-details {
  flex: 1;
  overflow: hidden;
}

.request-tabs {
  height: 100%;
}

.request-tabs :deep(.el-tab-pane) {
  height: calc(100% - 40px);
  overflow-y: auto;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.params-table,
.headers-table,
.form-data-table {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.param-row,
.header-row,
.form-data-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 40px;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
}

.form-data-row {
  grid-template-columns: 40px 1fr 100px 1fr 40px;
}

.header-row.header-row {
  background: #f9fafb;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
}

.param-row:last-child,
.header-row:last-child,
.form-data-row:last-child {
  border-bottom: none;
}

.body-type-selector {
  margin-bottom: 16px;
}

.raw-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.raw-editor {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.auth-type-selector {
  margin-bottom: 16px;
}

.auth-config {
  max-width: 500px;
}

.tests-editor {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.response-section {
  background: white;
  border-top: 1px solid #e5e7eb;
  max-height: 50%;
  display: flex;
  flex-direction: column;
}

.response-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.response-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.response-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status-tag {
  font-weight: 600;
}

.response-time,
.response-size {
  font-size: 12px;
  color: #6b7280;
}

.response-tabs {
  flex: 1;
  overflow: hidden;
}

.response-tabs :deep(.el-tab-pane) {
  height: calc(100% - 40px);
  overflow-y: auto;
  padding: 16px;
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

.pretty-json,
.raw-text {
  margin: 0;
  padding: 16px;
  background: #f9fafb;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

.preview-frame {
  width: 100%;
  height: 400px;
  border: none;
}

.response-headers {
  max-height: 400px;
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

.test-results {
  max-height: 400px;
  overflow-y: auto;
}

.test-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.test-item.passed {
  background: #f0f9ff;
  border-color: #10b981;
}

.test-item.failed {
  background: #fef2f2;
  border-color: #ef4444;
}

.test-icon {
  font-size: 16px;
  margin-top: 2px;
}

.test-item.passed .test-icon {
  color: #10b981;
}

.test-item.failed .test-icon {
  color: #ef4444;
}

.test-content {
  flex: 1;
}

.test-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.test-error {
  font-size: 12px;
  color: #ef4444;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1024px) {
  .api-debugger {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
}

@media (max-width: 768px) {
  .request-line {
    flex-direction: column;
    align-items: stretch;
  }
  
  .request-meta {
    flex-direction: column;
    align-items: stretch;
  }
  
  .response-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>