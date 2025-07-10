<template>
  <div class="environments-page">
    <div class="page-header">
      <h1>环境管理</h1>
      <div class="header-actions">
        <el-button @click="showCreateDialog = true" type="primary">
          新建环境
        </el-button>
        <el-button @click="importEnvironments">
          导入
        </el-button>
      </div>
    </div>
    
    <div class="environments-list">
      <div 
        v-for="env in environments" 
        :key="env.id"
        class="environment-card"
        :class="{ active: env.id === activeEnvironmentId }"
      >
        <div class="card-header">
          <div class="env-info">
            <h3>{{ env.name }}</h3>
            <el-tag :type="getEnvTagType(env.type)" size="small">
              {{ env.type }}
            </el-tag>
          </div>
          <div class="card-actions">
            <el-button 
              @click="setActiveEnvironment(env.id)" 
              :type="env.id === activeEnvironmentId ? 'primary' : 'default'"
              size="small"
            >
              {{ env.id === activeEnvironmentId ? '当前环境' : '切换' }}
            </el-button>
            <el-dropdown @command="handleAction">
              <el-button text size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'edit', env }">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'duplicate', env }">
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'export', env }">
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete', env }" divided>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <p class="env-description">{{ env.description }}</p>
        
        <div class="env-variables">
          <div class="variables-header">
            <span>环境变量 ({{ env.variables.length }})</span>
            <el-button @click="addVariable(env.id)" text size="small">
              <el-icon><Plus /></el-icon>
              添加变量
            </el-button>
          </div>
          
          <div class="variables-list">
            <div 
              v-for="(variable, index) in env.variables.slice(0, 3)" 
              :key="index"
              class="variable-item"
            >
              <span class="variable-key">{{ variable.key }}</span>
              <span class="variable-value">{{ variable.value }}</span>
            </div>
            <div v-if="env.variables.length > 3" class="more-variables">
              +{{ env.variables.length - 3 }} 更多变量
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建环境对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建环境" width="600px">
      <el-form :model="newEnvironment" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="newEnvironment.name" placeholder="请输入环境名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newEnvironment.type" placeholder="选择环境类型">
            <el-option label="开发环境" value="development" />
            <el-option label="测试环境" value="testing" />
            <el-option label="预发布" value="staging" />
            <el-option label="生产环境" value="production" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="newEnvironment.description" 
            type="textarea" 
            placeholder="请输入环境描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="基础URL">
          <el-input v-model="newEnvironment.baseUrl" placeholder="https://api.example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createEnvironment">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { MoreFilled, Plus } from '@element-plus/icons-vue'

interface EnvironmentVariable {
  key: string
  value: string
  description?: string
}

interface Environment {
  id: string
  name: string
  type: 'development' | 'testing' | 'staging' | 'production'
  description: string
  baseUrl: string
  variables: EnvironmentVariable[]
  createdAt: Date
  updatedAt: Date
}

const environments = ref<Environment[]>([])
const activeEnvironmentId = ref<string>('')
const showCreateDialog = ref(false)
const newEnvironment = ref({
  name: '',
  type: 'development' as const,
  description: '',
  baseUrl: ''
})

const getEnvTagType = (type: string) => {
  const typeMap = {
    development: 'info',
    testing: 'warning', 
    staging: 'danger',
    production: 'success'
  }
  return typeMap[type as keyof typeof typeMap] || 'info'
}

const setActiveEnvironment = (envId: string) => {
  activeEnvironmentId.value = envId
  ElMessage.success('环境切换成功')
}

const createEnvironment = () => {
  if (!newEnvironment.value.name) {
    ElMessage.warning('请输入环境名称')
    return
  }
  
  const environment: Environment = {
    id: Date.now().toString(),
    name: newEnvironment.value.name,
    type: newEnvironment.value.type,
    description: newEnvironment.value.description,
    baseUrl: newEnvironment.value.baseUrl,
    variables: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  environments.value.push(environment)
  showCreateDialog.value = false
  newEnvironment.value = {
    name: '',
    type: 'development',
    description: '',
    baseUrl: ''
  }
  
  ElMessage.success('环境创建成功')
}

const handleAction = ({ action, env }: { action: string; env: Environment }) => {
  switch (action) {
    case 'edit':
      // 编辑逻辑
      ElMessage.info('编辑功能开发中')
      break
    case 'duplicate':
      // 复制逻辑
      ElMessage.info('复制功能开发中')
      break
    case 'export':
      // 导出逻辑
      ElMessage.info('导出功能开发中')
      break
    case 'delete':
      // 删除逻辑
      ElMessage.info('删除功能开发中')
      break
  }
}

const addVariable = (envId: string) => {
  ElMessage.info('添加变量功能开发中')
}

const importEnvironments = () => {
  ElMessage.info('导入功能开发中')
}

onMounted(() => {
  // 初始化示例数据
  environments.value = [
    {
      id: '1',
      name: '开发环境',
      type: 'development',
      description: '本地开发使用的环境配置',
      baseUrl: 'http://localhost:3000',
      variables: [
        { key: 'API_KEY', value: 'dev_api_key_123' },
        { key: 'DB_HOST', value: 'localhost' },
        { key: 'DEBUG', value: 'true' }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: '测试环境',
      type: 'testing',
      description: '用于功能测试的环境配置',
      baseUrl: 'https://test-api.example.com',
      variables: [
        { key: 'API_KEY', value: 'test_api_key_456' },
        { key: 'DB_HOST', value: 'test-db.example.com' },
        { key: 'DEBUG', value: 'false' }
      ],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: '生产环境',
      type: 'production',
      description: '正式生产环境配置',
      baseUrl: 'https://api.example.com',
      variables: [
        { key: 'API_KEY', value: 'prod_api_key_789' },
        { key: 'DB_HOST', value: 'prod-db.example.com' },
        { key: 'DEBUG', value: 'false' },
        { key: 'CACHE_TTL', value: '3600' }
      ],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25')
    }
  ]
  
  // 设置默认激活环境
  activeEnvironmentId.value = '1'
})
</script>

<style scoped>
.environments-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.environments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.environment-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.environment-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.environment-card.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.env-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.env-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.env-variables {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.variables-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variable-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.variable-key {
  font-weight: 500;
  color: #409eff;
  min-width: 100px;
}

.variable-value {
  color: #606266;
  font-family: 'Courier New', monospace;
}

.more-variables {
  padding: 8px 12px;
  text-align: center;
  color: #909399;
  font-size: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}
</style>