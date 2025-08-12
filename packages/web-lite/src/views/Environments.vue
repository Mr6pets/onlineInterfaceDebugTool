<template>
  <div class="environments-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          type="text"
          @click="$router.back()"
          class="back-btn"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">环境管理</h1>
      </div>
      
      <div class="header-right">
        <el-button
          type="primary"
          @click="handleCreateEnvironment"
        >
          <el-icon><Plus /></el-icon>
          新建环境
        </el-button>
        
        <el-button
          type="success"
          @click="handleExport"
          :disabled="environmentStore.environments.length === 0"
        >
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        
        <el-button
          type="warning"
          @click="handleImport"
        >
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
      </div>
    </div>
    
    <!-- 环境列表 -->
    <div class="environments-content">
      <div class="environments-list">
        <el-empty
          v-if="environmentStore.environments.length === 0"
          description="暂无环境配置"
          class="empty-state"
        >
          <el-button type="primary" @click="handleCreateEnvironment">
            创建第一个环境
          </el-button>
        </el-empty>
        
        <div v-else class="env-cards">
          <div
            v-for="env in environmentStore.environments"
            :key="env.id"
            class="env-card"
            :class="{ active: env.id === environmentStore.currentEnvironmentId }"
          >
            <div class="card-header">
              <div class="env-info">
                <h3 class="env-name">{{ env.name }}</h3>
                <p class="env-description" v-if="env.description">{{ env.description }}</p>
              </div>
              
              <div class="card-actions">
                <el-button
                  v-if="env.id !== environmentStore.currentEnvironmentId"
                  type="primary"
                  size="small"
                  @click="handleSwitchEnvironment(env.id)"
                >
                  切换
                </el-button>
                
                <el-tag
                  v-else
                  type="success"
                  size="small"
                >
                  当前环境
                </el-tag>
                
                <el-dropdown @command="(command: string) => handleEnvAction(command, env)">
                  <el-button type="text" size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                      <el-dropdown-item command="export">导出</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <div class="variables-section">
              <div class="section-header">
                <span class="section-title">环境变量 ({{ Object.keys(env.variables).length }})</span>
                <el-button
                  type="text"
                  size="small"
                  @click="handleAddVariable(env.id)"
                >
                  <el-icon><Plus /></el-icon>
                  添加变量
                </el-button>
              </div>
              
              <div class="variables-list">
                <div
                  v-for="(value, key) in env.variables"
                  :key="key"
                  class="variable-item"
                >
                  <div class="variable-key">{{ key }}</div>
                  <div class="variable-value">{{ value }}</div>
                  <div class="variable-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="handleEditVariable(env.id, key, value)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="handleDeleteVariable(env.id, key)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
                
                <div v-if="Object.keys(env.variables).length === 0" class="no-variables">
                  暂无环境变量
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 环境编辑对话框 -->
    <el-dialog
      v-model="envDialog.visible"
      :title="envDialog.isEdit ? '编辑环境' : '新建环境'"
      width="500px"
    >
      <el-form
        ref="envFormRef"
        :model="envDialog.form"
        :rules="envFormRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="envDialog.form.name"
            placeholder="请输入环境名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="envDialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入环境描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="envDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEnvironment">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 变量编辑对话框 -->
    <el-dialog
      v-model="varDialog.visible"
      :title="varDialog.isEdit ? '编辑变量' : '添加变量'"
      width="400px"
    >
      <el-form
        ref="varFormRef"
        :model="varDialog.form"
        :rules="varFormRules"
        label-width="60px"
      >
        <el-form-item label="键名" prop="key">
          <el-input
            v-model="varDialog.form.key"
            placeholder="请输入变量名"
            maxlength="50"
          />
        </el-form-item>
        
        <el-form-item label="值" prop="value">
          <el-input
            v-model="varDialog.form.value"
            type="textarea"
            :rows="3"
            placeholder="请输入变量值"
            maxlength="1000"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="varDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveVariable">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      title="导入环境配置"
      width="600px"
    >
      <el-form>
        <el-form-item label="导入模式">
          <el-radio-group v-model="importDialog.mode">
            <el-radio label="merge">合并模式（保留现有环境）</el-radio>
            <el-radio label="replace">替换模式（清空现有环境）</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="JSON数据">
          <el-input
            v-model="importDialog.data"
            type="textarea"
            :rows="10"
            placeholder="请粘贴导出的JSON数据"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="importDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  MoreFilled,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import { useEnvironmentStore } from '@/stores/environment'
import type { Environment } from '@/types'

const environmentStore = useEnvironmentStore()

// 环境对话框
const envDialog = reactive({
  visible: false,
  isEdit: false,
  envId: '',
  form: {
    name: '',
    description: ''
  }
})

// 变量对话框
const varDialog = reactive({
  visible: false,
  isEdit: false,
  envId: '',
  oldKey: '',
  form: {
    key: '',
    value: ''
  }
})

// 导入对话框
const importDialog = reactive({
  visible: false,
  mode: 'merge',
  data: ''
})

// 表单引用
const envFormRef = ref<FormInstance>()
const varFormRef = ref<FormInstance>()

// 环境表单验证规则
const envFormRules = {
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 变量表单验证规则
const varFormRules = {
  key: [
    { required: true, message: '请输入变量名', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '变量名只能包含字母、数字和下划线，且不能以数字开头', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '请输入变量值', trigger: 'blur' }
  ]
}

// 处理创建环境
const handleCreateEnvironment = () => {
  envDialog.visible = true
  envDialog.isEdit = false
  envDialog.envId = ''
  envDialog.form.name = ''
  envDialog.form.description = ''
}

// 处理环境操作
const handleEnvAction = (command: string, env: Environment) => {
  switch (command) {
    case 'edit':
      envDialog.visible = true
      envDialog.isEdit = true
      envDialog.envId = env.id
      envDialog.form.name = env.name
      envDialog.form.description = env.description || ''
      break
    case 'duplicate':
      environmentStore.duplicateEnvironment(env.id)
      ElMessage.success('环境已复制')
      break
    case 'export':
      exportSingleEnvironment(env)
      break
    case 'delete':
      handleDeleteEnvironment(env.id)
      break
  }
}

// 处理保存环境
const handleSaveEnvironment = async () => {
  if (!envFormRef.value) return
  
  try {
    await envFormRef.value.validate()
    
    if (envDialog.isEdit) {
      environmentStore.updateEnvironment(envDialog.envId, {
        name: envDialog.form.name,
        description: envDialog.form.description
      })
      ElMessage.success('环境已更新')
    } else {
      environmentStore.createEnvironment({
        name: envDialog.form.name,
        description: envDialog.form.description,
        variables: {}
      })
      ElMessage.success('环境已创建')
    }
    
    envDialog.visible = false
  } catch {
    // 验证失败
  }
}

// 处理删除环境
const handleDeleteEnvironment = async (envId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个环境吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    environmentStore.deleteEnvironment(envId)
    ElMessage.success('环境已删除')
  } catch {
    // 用户取消操作
  }
}

// 处理切换环境
const handleSwitchEnvironment = (envId: string) => {
  environmentStore.switchEnvironment(envId)
  const env = environmentStore.environments.find(e => e.id === envId)
  ElMessage.success(`已切换到环境：${env?.name}`)
}

// 处理添加变量
const handleAddVariable = (envId: string) => {
  varDialog.visible = true
  varDialog.isEdit = false
  varDialog.envId = envId
  varDialog.oldKey = ''
  varDialog.form.key = ''
  varDialog.form.value = ''
}

// 处理编辑变量
const handleEditVariable = (envId: string, key: string, value: string) => {
  varDialog.visible = true
  varDialog.isEdit = true
  varDialog.envId = envId
  varDialog.oldKey = key
  varDialog.form.key = key
  varDialog.form.value = value
}

// 处理保存变量
const handleSaveVariable = async () => {
  if (!varFormRef.value) return
  
  try {
    await varFormRef.value.validate()
    
    if (varDialog.isEdit) {
      environmentStore.updateVariable(
        varDialog.envId,
        varDialog.oldKey,
        varDialog.form.key,
        varDialog.form.value
      )
      ElMessage.success('变量已更新')
    } else {
      environmentStore.addVariable(
        varDialog.envId,
        varDialog.form.key,
        varDialog.form.value
      )
      ElMessage.success('变量已添加')
    }
    
    varDialog.visible = false
  } catch {
    // 验证失败
  }
}

// 处理删除变量
const handleDeleteVariable = async (envId: string, key: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除变量 "${key}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    environmentStore.removeVariable(envId, key)
    ElMessage.success('变量已删除')
  } catch {
    // 用户取消操作
  }
}

// 处理导出
const handleExport = () => {
  const data = environmentStore.exportEnvironments()
  downloadFile(data, 'api-debug-environments.json')
  ElMessage.success('环境配置已导出')
}

// 导出单个环境
const exportSingleEnvironment = (env: Environment) => {
  const data = JSON.stringify({ environments: [env] }, null, 2)
  downloadFile(data, `api-debug-env-${env.name}.json`)
  ElMessage.success('环境配置已导出')
}

// 处理导入
const handleImport = () => {
  importDialog.visible = true
  importDialog.data = ''
}

// 确认导入
const handleConfirmImport = () => {
  const merge = importDialog.mode === 'merge'
  if (environmentStore.importEnvironments(importDialog.data, merge)) {
    importDialog.visible = false
    importDialog.data = ''
    ElMessage.success('环境配置导入成功')
  } else {
    ElMessage.error('导入失败，请检查数据格式')
  }
}

// 下载文件
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped lang="scss">
.environments-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #f5f7fa);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-color, #303133);
    }
  }
  
  .header-right {
    display: flex;
    gap: 8px;
  }
}

.environments-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  .empty-state {
    margin-top: 60px;
  }
  
  .env-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
  }
}

.env-card {
  background: var(--card-bg, #ffffff);
  border: 2px solid var(--border-color, #dcdfe6);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  }
  
  &.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .env-info {
      flex: 1;
      
      .env-name {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color, #303133);
      }
      
      .env-description {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.4;
      }
    }
    
    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .variables-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color, #303133);
      }
    }
    
    .variables-list {
      .variable-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: var(--el-fill-color-lighter);
        border-radius: 6px;
        margin-bottom: 8px;
        
        .variable-key {
          flex: 0 0 120px;
          font-weight: 500;
          color: var(--el-color-primary);
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
        }
        
        .variable-value {
          flex: 1;
          color: var(--text-color, #303133);
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .variable-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        &:hover {
          .variable-actions {
            opacity: 1;
          }
        }
      }
      
      .no-variables {
        text-align: center;
        padding: 20px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    .header-right {
      justify-content: center;
    }
  }
  
  .environments-content {
    padding: 12px;
    
    .env-cards {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
  
  .env-card {
    padding: 16px;
    
    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .card-actions {
        justify-content: flex-end;
      }
    }
    
    .variables-section {
      .variable-item {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        
        .variable-key,
        .variable-value {
          flex: none;
        }
        
        .variable-actions {
          opacity: 1;
          justify-content: flex-end;
        }
      }
    }
  }
}
</style>