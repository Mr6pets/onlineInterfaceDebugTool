<template>
  <div class="environment-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>环境管理</h1>
          <p>管理不同环境的变量配置，支持开发、测试、生产等多环境切换</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateEnvironmentDialog = true">
            <el-icon><Plus /></el-icon>
            新建环境
          </el-button>
          <el-button @click="showImportDialog = true">
            <el-icon><Upload /></el-icon>
            导入环境
          </el-button>
          <el-dropdown @command="handleExport">
            <el-button>
              <el-icon><Download /></el-icon>
              导出环境
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="json">导出为 JSON</el-dropdown-item>
                <el-dropdown-item command="env">导出为 .env</el-dropdown-item>
                <el-dropdown-item command="postman">导出为 Postman</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 环境列表 -->
    <div class="environments-container">
      <!-- 左侧环境列表 -->
      <div class="environments-sidebar">
        <div class="sidebar-header">
          <h3>环境列表</h3>
          <div class="search-box">
            <el-input
              v-model="searchQuery"
              placeholder="搜索环境"
              prefix-icon="Search"
              size="small"
              clearable
            />
          </div>
        </div>
        
        <div class="environments-list">
          <div class="environment-groups">
            <!-- 全局变量 -->
            <div class="environment-group">
              <div class="group-header">
                <el-icon><Connection /></el-icon>
                <span>全局变量</span>
              </div>
              <div
                class="environment-item"
                :class="{ active: selectedEnvironment?.id === 'global' }"
                @click="selectEnvironment({ id: 'global', name: '全局变量', type: 'global' })"
              >
                <div class="env-info">
                  <div class="env-name">全局变量</div>
                  <div class="env-meta">{{ globalVariables.length }} 个变量</div>
                </div>
              </div>
            </div>

            <!-- 环境分组 -->
            <div v-for="group in filteredGroups" :key="group.id" class="environment-group">
              <div class="group-header">
                <el-icon><FolderOpened /></el-icon>
                <span>{{ group.name }}</span>
                <el-dropdown @command="(command) => handleGroupAction(command, group)" trigger="click">
                  <el-button type="text" size="small" @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名分组</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除分组</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              
              <div
                v-for="env in group.environments"
                :key="env.id"
                class="environment-item"
                :class="{ active: selectedEnvironment?.id === env.id }"
                @click="selectEnvironment(env)"
              >
                <div class="env-info">
                  <div class="env-name">{{ env.name }}</div>
                  <div class="env-meta">
                    {{ env.variables?.length || 0 }} 个变量
                    <el-tag v-if="env.id === currentEnvironmentId" type="success" size="small">当前</el-tag>
                  </div>
                </div>
                <div class="env-actions">
                  <el-dropdown @command="(command) => handleEnvironmentAction(command, env)" trigger="click">
                    <el-button type="text" size="small" @click.stop>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="setCurrent" v-if="env.id !== currentEnvironmentId">
                          设为当前环境
                        </el-dropdown-item>
                        <el-dropdown-item command="duplicate">复制环境</el-dropdown-item>
                        <el-dropdown-item command="export">导出环境</el-dropdown-item>
                        <el-dropdown-item command="rename">重命名</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除环境</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧变量编辑区域 -->
      <div class="variables-editor">
        <div v-if="selectedEnvironment" class="editor-content">
          <!-- 环境信息 -->
          <div class="environment-header">
            <div class="env-title">
              <h2>{{ selectedEnvironment.name }}</h2>
              <el-tag v-if="selectedEnvironment.id === currentEnvironmentId" type="success">当前环境</el-tag>
            </div>
            <div class="env-description" v-if="selectedEnvironment.description">
              {{ selectedEnvironment.description }}
            </div>
            <div class="env-actions">
              <el-button @click="showEditEnvironmentDialog = true" size="small">
                <el-icon><Edit /></el-icon>
                编辑信息
              </el-button>
              <el-button
                v-if="selectedEnvironment.id !== currentEnvironmentId && selectedEnvironment.id !== 'global'"
                type="primary"
                @click="setCurrentEnvironment(selectedEnvironment.id)"
                size="small"
              >
                <el-icon><Check /></el-icon>
                设为当前
              </el-button>
            </div>
          </div>

          <!-- 变量列表 -->
          <div class="variables-section">
            <div class="section-header">
              <h3>环境变量</h3>
              <div class="header-actions">
                <el-input
                  v-model="variableSearchQuery"
                  placeholder="搜索变量"
                  prefix-icon="Search"
                  size="small"
                  style="width: 200px; margin-right: 12px;"
                  clearable
                />
                <el-button type="primary" @click="addVariable" size="small">
                  <el-icon><Plus /></el-icon>
                  添加变量
                </el-button>
              </div>
            </div>

            <div class="variables-table">
              <div class="table-header">
                <div class="col-checkbox">
                  <el-checkbox
                    v-model="selectAll"
                    @change="handleSelectAll"
                    :indeterminate="isIndeterminate"
                  />
                </div>
                <div class="col-key">变量名</div>
                <div class="col-value">当前值</div>
                <div class="col-initial">初始值</div>
                <div class="col-description">描述</div>
                <div class="col-actions">操作</div>
              </div>
              
              <div class="table-body">
                <div
                  v-for="(variable, index) in filteredVariables"
                  :key="index"
                  class="table-row"
                  :class="{ disabled: !variable.enabled }"
                >
                  <div class="col-checkbox">
                    <el-checkbox
                      v-model="variable.enabled"
                      @change="markAsModified"
                    />
                  </div>
                  <div class="col-key">
                    <el-input
                      v-model="variable.key"
                      placeholder="变量名"
                      size="small"
                      @input="markAsModified"
                      :disabled="!variable.enabled"
                    />
                  </div>
                  <div class="col-value">
                    <el-input
                      v-model="variable.value"
                      placeholder="当前值"
                      size="small"
                      @input="markAsModified"
                      :disabled="!variable.enabled"
                      :type="variable.secret ? 'password' : 'text'"
                      show-password
                    />
                  </div>
                  <div class="col-initial">
                    <el-input
                      v-model="variable.initialValue"
                      placeholder="初始值"
                      size="small"
                      @input="markAsModified"
                      :disabled="!variable.enabled"
                      :type="variable.secret ? 'password' : 'text'"
                      show-password
                    />
                  </div>
                  <div class="col-description">
                    <el-input
                      v-model="variable.description"
                      placeholder="描述"
                      size="small"
                      @input="markAsModified"
                      :disabled="!variable.enabled"
                    />
                  </div>
                  <div class="col-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="variable.secret = !variable.secret"
                      :title="variable.secret ? '显示值' : '隐藏值'"
                    >
                      <el-icon><View v-if="variable.secret" /><Hide v-else /></el-icon>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="duplicateVariable(index)"
                      title="复制变量"
                    >
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="removeVariable(index)"
                      title="删除变量"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 批量操作 -->
            <div v-if="selectedVariables.length > 0" class="bulk-actions">
              <div class="bulk-info">
                已选择 {{ selectedVariables.length }} 个变量
              </div>
              <div class="bulk-buttons">
                <el-button @click="bulkEnable" size="small">批量启用</el-button>
                <el-button @click="bulkDisable" size="small">批量禁用</el-button>
                <el-button @click="bulkDelete" type="danger" size="small">批量删除</el-button>
              </div>
            </div>

            <!-- 保存按钮 -->
            <div class="save-actions">
              <el-button @click="resetChanges" :disabled="!hasChanges">重置更改</el-button>
              <el-button type="primary" @click="saveChanges" :loading="saving" :disabled="!hasChanges">
                <el-icon><DocumentCopy /></el-icon>
                保存更改
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="选择一个环境开始编辑变量" />
        </div>
      </div>
    </div>

    <!-- 创建环境对话框 -->
    <el-dialog
      v-model="showCreateEnvironmentDialog"
      title="创建新环境"
      width="500px"
    >
      <el-form
        ref="createEnvironmentFormRef"
        :model="createEnvironmentForm"
        :rules="environmentFormRules"
        label-width="80px"
      >
        <el-form-item label="环境名称" prop="name">
          <el-input
            v-model="createEnvironmentForm.name"
            placeholder="请输入环境名称"
          />
        </el-form-item>
        <el-form-item label="环境描述" prop="description">
          <el-input
            v-model="createEnvironmentForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入环境描述"
          />
        </el-form-item>
        <el-form-item label="环境分组" prop="groupId">
          <el-select v-model="createEnvironmentForm.groupId" placeholder="选择分组">
            <el-option label="默认分组" value="default" />
            <el-option
              v-for="group in environmentGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="复制变量">
          <el-select v-model="createEnvironmentForm.copyFromId" placeholder="从现有环境复制变量（可选）" clearable>
            <el-option
              v-for="env in allEnvironments"
              :key="env.id"
              :label="env.name"
              :value="env.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateEnvironmentDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateEnvironment" :loading="creating">
            创建环境
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑环境对话框 -->
    <el-dialog
      v-model="showEditEnvironmentDialog"
      title="编辑环境信息"
      width="500px"
    >
      <el-form
        ref="editEnvironmentFormRef"
        :model="editEnvironmentForm"
        :rules="environmentFormRules"
        label-width="80px"
      >
        <el-form-item label="环境名称" prop="name">
          <el-input
            v-model="editEnvironmentForm.name"
            placeholder="请输入环境名称"
          />
        </el-form-item>
        <el-form-item label="环境描述" prop="description">
          <el-input
            v-model="editEnvironmentForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入环境描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditEnvironmentDialog = false">取消</el-button>
          <el-button type="primary" @click="handleEditEnvironment" :loading="editing">
            保存更改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入环境对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入环境"
      width="600px"
    >
      <div class="import-section">
        <el-tabs v-model="importType">
          <el-tab-pane label="JSON 文件" name="json">
            <el-upload
              ref="jsonUploadRef"
              :auto-upload="false"
              :show-file-list="false"
              accept=".json"
              @change="handleJsonFileChange"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                选择 JSON 文件
              </el-button>
            </el-upload>
            <div v-if="importPreview.json" class="import-preview">
              <h4>预览导入内容：</h4>
              <pre>{{ JSON.stringify(importPreview.json, null, 2) }}</pre>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label=".env 文件" name="env">
            <el-upload
              ref="envUploadRef"
              :auto-upload="false"
              :show-file-list="false"
              accept=".env"
              @change="handleEnvFileChange"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                选择 .env 文件
              </el-button>
            </el-upload>
            <div v-if="importPreview.env" class="import-preview">
              <h4>预览导入内容：</h4>
              <pre>{{ importPreview.env }}</pre>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="文本输入" name="text">
            <el-input
              v-model="importText"
              type="textarea"
              :rows="10"
              placeholder="粘贴环境变量内容...\n\n支持格式：\nKEY1=value1\nKEY2=value2\n\n或 JSON 格式"
            />
          </el-tab-pane>
        </el-tabs>
        
        <div class="import-options">
          <el-form label-width="100px">
            <el-form-item label="导入到">
              <el-select v-model="importTargetEnvironment" placeholder="选择目标环境">
                <el-option label="新建环境" value="new" />
                <el-option
                  v-for="env in allEnvironments"
                  :key="env.id"
                  :label="env.name"
                  :value="env.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="importTargetEnvironment === 'new'" label="环境名称">
              <el-input v-model="importEnvironmentName" placeholder="请输入新环境名称" />
            </el-form-item>
            <el-form-item label="冲突处理">
              <el-radio-group v-model="importConflictMode">
                <el-radio label="overwrite">覆盖现有变量</el-radio>
                <el-radio label="skip">跳过重复变量</el-radio>
                <el-radio label="rename">重命名重复变量</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary" @click="handleImport" :loading="importing">
            导入环境
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import {
  Plus,
  Upload,
  Download,
  ArrowDown,
  Connection,
  FolderOpened,
  MoreFilled,
  Edit,
  Check,
  View,
  Hide,
  CopyDocument,
  Delete,
  DocumentCopy
} from '@element-plus/icons-vue'
import { useEnvironmentStore } from '@/stores/environment'
// 临时本地类型定义
interface Environment {
  id: string
  name: string
  description?: string
  variables: EnvironmentVariable[]
  isActive: boolean
  groupId?: string
  createdAt: Date
  updatedAt: Date
}

interface EnvironmentVariable {
  key: string
  value: string
  description?: string
  isSecret?: boolean
  isEnabled?: boolean
}

interface EnvironmentGroup {
  id: string
  name: string
  description?: string
  color?: string
  environments: string[]
}

const environmentStore = useEnvironmentStore()

// 响应式数据
const searchQuery = ref('')
const variableSearchQuery = ref('')
const selectedEnvironment = ref<any>(null)
const currentEnvironmentId = ref('dev')
const selectAll = ref(false)
const hasChanges = ref(false)
const saving = ref(false)
const creating = ref(false)
const editing = ref(false)
const importing = ref(false)

// 对话框状态
const showCreateEnvironmentDialog = ref(false)
const showEditEnvironmentDialog = ref(false)
const showImportDialog = ref(false)

// 表单引用
const createEnvironmentFormRef = ref<FormInstance>()
const editEnvironmentFormRef = ref<FormInstance>()
const jsonUploadRef = ref()
const envUploadRef = ref()

// 导入相关
const importType = ref('json')
const importText = ref('')
const importTargetEnvironment = ref('new')
const importEnvironmentName = ref('')
const importConflictMode = ref('overwrite')
const importPreview = ref<any>({})

// 表单数据
const createEnvironmentForm = ref({
  name: '',
  description: '',
  groupId: 'default',
  copyFromId: ''
})

const editEnvironmentForm = ref({
  name: '',
  description: ''
})

// 模拟数据
const environmentGroups = ref<EnvironmentGroup[]>([
  {
    id: 'default',
    name: '默认分组',
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  },
  {
    id: 'dev',
    name: '开发环境',
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  }
])

const environments = ref<Environment[]>([
  {
    id: 'dev',
    name: '开发环境',
    description: '本地开发环境配置',
    variables: [
      { key: 'baseUrl', value: 'https://dev-api.example.com', initialValue: 'https://dev-api.example.com', enabled: true, secret: false },
      { key: 'apiKey', value: 'dev-key-123', initialValue: 'dev-key-123', enabled: true, secret: true },
      { key: 'timeout', value: '5000', initialValue: '5000', enabled: true, secret: false }
    ],
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  },
  {
    id: 'test',
    name: '测试环境',
    description: '测试环境配置',
    variables: [
      { key: 'baseUrl', value: 'https://test-api.example.com', initialValue: 'https://test-api.example.com', enabled: true, secret: false },
      { key: 'apiKey', value: 'test-key-456', initialValue: 'test-key-456', enabled: true, secret: true }
    ],
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  },
  {
    id: 'prod',
    name: '生产环境',
    description: '生产环境配置',
    variables: [
      { key: 'baseUrl', value: 'https://api.example.com', initialValue: 'https://api.example.com', enabled: true, secret: false },
      { key: 'apiKey', value: 'prod-key-789', initialValue: 'prod-key-789', enabled: true, secret: true }
    ],
    workspaceId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1'
  }
])

const globalVariables = ref<EnvironmentVariable[]>([
  { key: 'version', value: '1.0.0', initialValue: '1.0.0', enabled: true, secret: false },
  { key: 'userAgent', value: 'API-Debug-Tool/1.0', initialValue: 'API-Debug-Tool/1.0', enabled: true, secret: false }
])

// 表单验证规则
const environmentFormRules: FormRules = {
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' }
  ]
}

// 计算属性
const filteredGroups = computed(() => {
  const groups = environmentGroups.value.map(group => ({
    ...group,
    environments: environments.value.filter(env => {
      const matchesSearch = !searchQuery.value || 
        env.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchesSearch
    })
  }))
  
  return groups.filter(group => group.environments.length > 0)
})

const allEnvironments = computed(() => {
  return environments.value
})

const filteredVariables = computed(() => {
  if (!selectedEnvironment.value) return []
  
  const variables = selectedEnvironment.value.id === 'global' 
    ? globalVariables.value 
    : selectedEnvironment.value.variables || []
  
  if (!variableSearchQuery.value) return variables
  
  return variables.filter(variable => 
    variable.key.toLowerCase().includes(variableSearchQuery.value.toLowerCase()) ||
    variable.value.toLowerCase().includes(variableSearchQuery.value.toLowerCase())
  )
})

const selectedVariables = computed(() => {
  return filteredVariables.value.filter(variable => variable.selected)
})

const isIndeterminate = computed(() => {
  const selected = selectedVariables.value.length
  const total = filteredVariables.value.length
  return selected > 0 && selected < total
})

// 方法
const selectEnvironment = (env: any) => {
  selectedEnvironment.value = env
  if (env.id !== 'global') {
    editEnvironmentForm.value = {
      name: env.name,
      description: env.description || ''
    }
  }
}

const setCurrentEnvironment = async (environmentId: string) => {
  try {
    await environmentStore.setCurrentEnvironment(environmentId)
    currentEnvironmentId.value = environmentId
    ElMessage.success('当前环境设置成功')
  } catch (error) {
    ElMessage.error('设置当前环境失败')
  }
}

const handleGroupAction = async (command: string, group: EnvironmentGroup) => {
  switch (command) {
    case 'rename':
      ElMessage.info('重命名分组功能开发中')
      break
    case 'delete':
      await handleDeleteGroup(group)
      break
  }
}

const handleEnvironmentAction = async (command: string, env: Environment) => {
  switch (command) {
    case 'setCurrent':
      await setCurrentEnvironment(env.id)
      break
    case 'duplicate':
      await duplicateEnvironment(env)
      break
    case 'export':
      await exportEnvironment(env)
      break
    case 'rename':
      ElMessage.info('重命名环境功能开发中')
      break
    case 'delete':
      await handleDeleteEnvironment(env)
      break
  }
}

const handleDeleteGroup = async (group: EnvironmentGroup) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组 "${group.name}" 吗？分组下的所有环境也将被删除。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('分组删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const handleDeleteEnvironment = async (env: Environment) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除环境 "${env.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('环境删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const duplicateEnvironment = async (env: Environment) => {
  try {
    const newEnv = {
      ...env,
      id: `${env.id}_copy_${Date.now()}`,
      name: `${env.name} 副本`,
      variables: env.variables?.map(v => ({ ...v })) || []
    }
    
    environments.value.push(newEnv)
    ElMessage.success('环境复制成功')
  } catch (error) {
    ElMessage.error('复制环境失败')
  }
}

const exportEnvironment = async (env: Environment) => {
  try {
    const data = {
      name: env.name,
      description: env.description,
      variables: env.variables
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${env.name}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('环境导出成功')
  } catch (error) {
    ElMessage.error('导出环境失败')
  }
}

const addVariable = () => {
  if (!selectedEnvironment.value) return
  
  const newVariable = {
    key: '',
    value: '',
    initialValue: '',
    enabled: true,
    secret: false,
    description: ''
  }
  
  if (selectedEnvironment.value.id === 'global') {
    globalVariables.value.push(newVariable)
  } else {
    if (!selectedEnvironment.value.variables) {
      selectedEnvironment.value.variables = []
    }
    selectedEnvironment.value.variables.push(newVariable)
  }
  
  markAsModified()
}

const removeVariable = (index: number) => {
  if (selectedEnvironment.value.id === 'global') {
    globalVariables.value.splice(index, 1)
  } else {
    selectedEnvironment.value.variables.splice(index, 1)
  }
  markAsModified()
}

const duplicateVariable = (index: number) => {
  const variables = selectedEnvironment.value.id === 'global' 
    ? globalVariables.value 
    : selectedEnvironment.value.variables
  
  const original = variables[index]
  const duplicate = {
    ...original,
    key: `${original.key}_copy`
  }
  
  variables.splice(index + 1, 0, duplicate)
  markAsModified()
}

const handleSelectAll = (value: boolean) => {
  filteredVariables.value.forEach(variable => {
    variable.selected = value
  })
}

const bulkEnable = () => {
  selectedVariables.value.forEach(variable => {
    variable.enabled = true
  })
  markAsModified()
}

const bulkDisable = () => {
  selectedVariables.value.forEach(variable => {
    variable.enabled = false
  })
  markAsModified()
}

const bulkDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedVariables.value.length} 个变量吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const variables = selectedEnvironment.value.id === 'global' 
      ? globalVariables.value 
      : selectedEnvironment.value.variables
    
    const toDelete = selectedVariables.value
    toDelete.forEach(variable => {
      const index = variables.indexOf(variable)
      if (index > -1) {
        variables.splice(index, 1)
      }
    })
    
    markAsModified()
    ElMessage.success('批量删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const markAsModified = () => {
  hasChanges.value = true
}

const saveChanges = async () => {
  if (!selectedEnvironment.value) return
  
  saving.value = true
  try {
    if (selectedEnvironment.value.id === 'global') {
      await environmentStore.saveGlobalVariables(globalVariables.value)
    } else {
      await environmentStore.updateEnvironment(selectedEnvironment.value.id, selectedEnvironment.value)
    }
    
    hasChanges.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetChanges = () => {
  // 重新加载数据
  hasChanges.value = false
  ElMessage.info('更改已重置')
}

const handleCreateEnvironment = async () => {
  if (!createEnvironmentFormRef.value) return
  
  try {
    await createEnvironmentFormRef.value.validate()
    creating.value = true
    
    const newEnvironment = await environmentStore.createEnvironment(createEnvironmentForm.value)
    
    showCreateEnvironmentDialog.value = false
    resetCreateEnvironmentForm()
    ElMessage.success('环境创建成功')
    
    // 刷新环境列表
    await loadEnvironments()
  } catch (error) {
    console.error('Failed to create environment:', error)
  } finally {
    creating.value = false
  }
}

const handleEditEnvironment = async () => {
  if (!editEnvironmentFormRef.value || !selectedEnvironment.value) return
  
  try {
    await editEnvironmentFormRef.value.validate()
    editing.value = true
    
    await environmentStore.updateEnvironment(selectedEnvironment.value.id, editEnvironmentForm.value)
    
    // 更新本地数据
    selectedEnvironment.value.name = editEnvironmentForm.value.name
    selectedEnvironment.value.description = editEnvironmentForm.value.description
    
    showEditEnvironmentDialog.value = false
    ElMessage.success('环境信息更新成功')
  } catch (error) {
    console.error('Failed to edit environment:', error)
  } finally {
    editing.value = false
  }
}

const handleExport = (format: string) => {
  ElMessage.info(`导出为 ${format} 格式功能开发中`)
}

const handleJsonFileChange = (file: UploadFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      importPreview.value.json = JSON.parse(content)
    } catch (error) {
      ElMessage.error('JSON 文件格式错误')
    }
  }
  reader.readAsText(file.raw!)
}

const handleEnvFileChange = (file: UploadFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    importPreview.value.env = content
  }
  reader.readAsText(file.raw!)
}

const handleImport = async () => {
  importing.value = true
  try {
    // 处理导入逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showImportDialog.value = false
    ElMessage.success('环境导入成功')
    
    // 刷新环境列表
    await loadEnvironments()
  } catch (error) {
    ElMessage.error('导入环境失败')
  } finally {
    importing.value = false
  }
}

const resetCreateEnvironmentForm = () => {
  createEnvironmentForm.value = {
    name: '',
    description: '',
    groupId: 'default',
    copyFromId: ''
  }
  createEnvironmentFormRef.value?.resetFields()
}

const loadEnvironments = async () => {
  try {
    await environmentStore.loadEnvironments()
  } catch (error) {
    ElMessage.error('加载环境列表失败')
  }
}

// 监听选择状态变化
watch(
  () => selectedVariables.value.length,
  (newLength) => {
    const total = filteredVariables.value.length
    selectAll.value = newLength === total && total > 0
  }
)

// 生命周期
onMounted(() => {
  loadEnvironments()
})
</script>

<style scoped>
.environment-management {
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

.environments-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.environments-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.environments-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.environment-group {
  margin-bottom: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.environment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.environment-item:hover {
  background: #f3f4f6;
}

.environment-item.active {
  background: #eff6ff;
  border: 1px solid #3b82f6;
}

.env-info {
  flex: 1;
  min-width: 0;
}

.env-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.env-meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.environment-item:hover .env-actions {
  opacity: 1;
}

.variables-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.environment-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.env-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.env-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.env-description {
  color: #6b7280;
  margin-bottom: 16px;
}

.env-actions {
  display: flex;
  gap: 12px;
}

.variables-section {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
}

.variables-table {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 1fr 120px;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-body {
  flex: 1;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 1fr 120px;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.disabled {
  opacity: 0.5;
}

.col-actions {
  display: flex;
  gap: 4px;
}

.bulk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  margin: 16px 0;
}

.bulk-info {
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

.save-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  margin-top: 16px;
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

.import-section {
  margin-bottom: 16px;
}

.import-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.import-preview h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.import-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.import-options {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 1024px) {
  .environments-container {
    flex-direction: column;
  }
  
  .environments-sidebar {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
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
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .col-actions {
    justify-content: center;
  }
}
</style>