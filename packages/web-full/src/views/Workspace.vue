<template>
  <div class="workspace-container">
    <div class="workspace-header">
      <div class="workspace-info">
        <h2>{{ currentWorkspace?.name || '工作空间' }}</h2>
        <p>{{ currentWorkspace?.description }}</p>
      </div>
      <div class="workspace-actions">
        <el-select
          v-model="activeEnvironmentId"
          placeholder="选择环境"
          size="small"
          style="width: 200px"
        >
          <el-option
            v-for="env in environments"
            :key="env.id"
            :label="env.name"
            :value="env.id"
          />
        </el-select>
        <el-button @click="showEnvironmentDialog = true" size="small">
          管理环境
        </el-button>
        <el-button @click="showImportDialog = true" size="small">
          导入
        </el-button>
        <el-button @click="exportWorkspace" size="small">
          导出
        </el-button>
      </div>
    </div>

    <div class="workspace-content">
      <div class="sidebar">
        <CollectionTree
          :collections="collections"
          @select-request="handleSelectRequest"
          @create-collection="showCollectionDialog = true"
          @edit-collection="handleEditCollection"
          @delete-collection="handleDeleteCollection"
        />
      </div>
      
      <div class="main-content">
        <RequestTabs
          v-model:active-tab="activeTab"
          :tabs="openTabs"
          @close-tab="closeTab"
          @new-tab="newTab"
        />
        
        <div class="tab-content">
          <RequestPanel
            v-if="currentTab"
            :key="currentTab.id"
            v-model:request="currentTab.request"
            :environment="currentEnvironment"
            @send-request="handleSendRequest"
          />
          
          <div v-else class="empty-state">
            <el-empty description="选择一个请求开始调试" />
          </div>
        </div>
      </div>
    </div>

    <!-- 环境管理对话框 -->
    <EnvironmentDialog
      v-model="showEnvironmentDialog"
      :environments="environments"
      @save="handleSaveEnvironment"
      @delete="handleDeleteEnvironment"
    />

    <!-- 集合管理对话框 -->
    <CollectionDialog
      v-model="showCollectionDialog"
      :collection="editingCollection"
      @save="handleSaveCollection"
    />

    <!-- 导入对话框 -->
    <ImportDialog
      v-model="showImportDialog"
      @import="handleImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CollectionTree from '../components/CollectionTree.vue'
import RequestTabs from '../components/RequestTabs.vue'
import RequestPanel from '../components/RequestPanel.vue'
import EnvironmentDialog from '../components/EnvironmentDialog.vue'
import CollectionDialog from '../components/CollectionDialog.vue'
import ImportDialog from '../components/ImportDialog.vue'
import { useWorkspaceStore } from '../stores/workspace'
// 临时本地类型定义
interface ApiCollection {
  id: string
  name: string
  description?: string
  requests: any[]
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

interface Environment {
  id: string
  name: string
  variables: any[]
  isActive: boolean
}

interface RequestConfig {
  method: string
  url: string
  headers?: Record<string, string>
  params?: Record<string, string>
  body?: any
}

interface RequestTab {
  id: string
  name: string
  request: RequestConfig
  saved: boolean
}

const workspaceStore = useWorkspaceStore()

const activeEnvironmentId = ref('')
const activeTab = ref('')
const openTabs = ref<RequestTab[]>([])
const showEnvironmentDialog = ref(false)
const showCollectionDialog = ref(false)
const showImportDialog = ref(false)
const editingCollection = ref<ApiCollection | null>(null)

const currentWorkspace = computed(() => workspaceStore.currentWorkspace)
const environments = computed(() => workspaceStore.environments)
const collections = computed(() => workspaceStore.collections)
const currentEnvironment = computed(() => 
  environments.value.find(env => env.id === activeEnvironmentId.value)
)
const currentTab = computed(() => 
  openTabs.value.find(tab => tab.id === activeTab.value)
)

onMounted(() => {
  workspaceStore.loadWorkspace()
  if (environments.value.length > 0) {
    activeEnvironmentId.value = environments.value.find(env => env.isActive)?.id || environments.value[0].id
  }
})

const handleSelectRequest = (request: RequestConfig, name: string) => {
  const existingTab = openTabs.value.find(tab => 
    tab.request.url === request.url && tab.request.method === request.method
  )
  
  if (existingTab) {
    activeTab.value = existingTab.id
  } else {
    const newTab: RequestTab = {
      id: Date.now().toString(),
      name,
      request: { ...request },
      saved: true
    }
    openTabs.value.push(newTab)
    activeTab.value = newTab.id
  }
}

const newTab = () => {
  const newTab: RequestTab = {
    id: Date.now().toString(),
    name: '新请求',
    request: {
      url: '',
      method: 'GET'
    },
    saved: false
  }
  openTabs.value.push(newTab)
  activeTab.value = newTab.id
}

const closeTab = (tabId: string) => {
  const index = openTabs.value.findIndex(tab => tab.id === tabId)
  if (index > -1) {
    openTabs.value.splice(index, 1)
    if (activeTab.value === tabId && openTabs.value.length > 0) {
      activeTab.value = openTabs.value[Math.max(0, index - 1)].id
    }
  }
}

const handleSendRequest = async (request: RequestConfig) => {
  // 发送请求逻辑
  ElMessage.success('请求已发送')
}

const handleSaveEnvironment = (environment: Environment) => {
  workspaceStore.saveEnvironment(environment)
  ElMessage.success('环境已保存')
}

const handleDeleteEnvironment = (environmentId: string) => {
  workspaceStore.deleteEnvironment(environmentId)
  ElMessage.success('环境已删除')
}

const handleSaveCollection = (collection: ApiCollection) => {
  workspaceStore.saveCollection(collection)
  editingCollection.value = null
  ElMessage.success('集合已保存')
}

const handleEditCollection = (collection: ApiCollection) => {
  editingCollection.value = collection
  showCollectionDialog.value = true
}

const handleDeleteCollection = (collectionId: string) => {
  workspaceStore.deleteCollection(collectionId)
  ElMessage.success('集合已删除')
}

const handleImport = (importData: any) => {
  workspaceStore.importData(importData)
  ElMessage.success('导入成功')
}

const exportWorkspace = () => {
  workspaceStore.exportWorkspace()
  ElMessage.success('导出成功')
}
</script>

<style lang="scss" scoped>
.workspace-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  
  .workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #e4e7ed;
    
    .workspace-info {
      h2 {
        margin: 0 0 4px 0;
        font-size: 18px;
        color: #303133;
      }
      
      p {
        margin: 0;
        font-size: 12px;
        color: #909399;
      }
    }
    
    .workspace-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }
  
  .workspace-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    
    .sidebar {
      width: 300px;
      border-right: 1px solid #e4e7ed;
      overflow: auto;
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .tab-content {
        flex: 1;
        overflow: hidden;
      }
      
      .empty-state {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}
</style>