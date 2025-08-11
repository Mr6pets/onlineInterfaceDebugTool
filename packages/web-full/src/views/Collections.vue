<template>
  <div class="collections-page">
    <div class="page-header">
      <h1>接口集合</h1>
      <div class="header-actions">
        <el-button @click="showCreateDialog = true" type="primary">
          新建集合
        </el-button>
        <el-button @click="importCollection">
          导入
        </el-button>
      </div>
    </div>
    
    <div class="collections-grid">
      <div 
        v-for="collection in collections" 
        :key="collection.id"
        class="collection-card"
        @click="openCollection(collection)"
      >
        <div class="card-header">
          <h3>{{ collection.name }}</h3>
          <el-dropdown @command="handleAction">
            <el-button text>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'edit', collection }">
                  编辑
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'duplicate', collection }">
                  复制
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'export', collection }">
                  导出
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'delete', collection }" divided>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <p class="card-description">{{ collection.description }}</p>
        
        <div class="card-stats">
          <span class="stat">
            <el-icon><Document /></el-icon>
            {{ collection.requestCount }} 个请求
          </span>
          <span class="stat">
            <el-icon><Clock /></el-icon>
            {{ formatDate(collection.updatedAt) }}
          </span>
        </div>
      </div>
      
      <!-- 新建集合卡片 -->
      <div class="collection-card create-card" @click="showCreateDialog = true">
        <el-icon class="create-icon"><Plus /></el-icon>
        <span>新建集合</span>
      </div>
    </div>
    
    <!-- 创建集合对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建集合" width="500px">
      <el-form :model="newCollection" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="newCollection.name" placeholder="请输入集合名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="newCollection.description" 
            type="textarea" 
            placeholder="请输入集合描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createCollection">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MoreFilled, Document, Clock, Plus } from '@element-plus/icons-vue'

interface Collection {
  id: string
  name: string
  description: string
  requestCount: number
  createdAt: Date
  updatedAt: Date
}

const router = useRouter()
const collections = ref<Collection[]>([])
const showCreateDialog = ref(false)
const newCollection = ref({
  name: '',
  description: ''
})

const openCollection = (collection: Collection) => {
  router.push(`/collections/${collection.id}`)
}

const createCollection = () => {
  if (!newCollection.value.name) {
    ElMessage.warning('请输入集合名称')
    return
  }
  
  const collection: Collection = {
    id: Date.now().toString(),
    name: newCollection.value.name,
    description: newCollection.value.description,
    requestCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  collections.value.push(collection)
  showCreateDialog.value = false
  newCollection.value = { name: '', description: '' }
  
  ElMessage.success('集合创建成功')
}

const handleAction = ({ action, collection }: { action: string; collection: Collection }) => {
  switch (action) {
    case 'edit':
      // 编辑逻辑
      break
    case 'duplicate':
      // 复制逻辑
      break
    case 'export':
      // 导出逻辑
      break
    case 'delete':
      // 删除逻辑
      break
  }
}

const importCollection = () => {
  // 导入逻辑
  ElMessage.info('导入功能开发中')
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

onMounted(() => {
  // 初始化示例数据
  collections.value = [
    {
      id: '1',
      name: '用户管理API',
      description: '用户注册、登录、信息管理相关接口',
      requestCount: 15,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2', 
      name: '订单系统API',
      description: '订单创建、查询、支付相关接口',
      requestCount: 8,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20')
    }
  ]
})
</script>

<style scoped>
.collections-page {
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

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.collection-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.collection-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.create-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  border-style: dashed;
  color: #909399;
}

.create-card:hover {
  color: #409eff;
  border-color: #409eff;
}

.create-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.card-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}
</style>