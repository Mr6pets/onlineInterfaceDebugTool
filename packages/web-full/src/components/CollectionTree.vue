<template>
  <div class="collection-tree">
    <div class="tree-header">
      <h3>接口集合</h3>
      <el-button 
        size="small" 
        type="primary" 
        @click="$emit('create-collection')"
      >
        <el-icon><Plus /></el-icon>
        新建集合
      </el-button>
    </div>
    
    <div class="tree-content">
      <el-tree
        :data="treeData"
        :props="treeProps"
        node-key="id"
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content">
              <el-icon v-if="data.type === 'collection'">
                <Folder />
              </el-icon>
              <el-icon v-else>
                <Document />
              </el-icon>
              <span class="node-label">{{ node.label }}</span>
              <el-tag 
                v-if="data.type === 'request'" 
                :type="getMethodTagType(data.method)" 
                size="small"
                class="method-tag"
              >
                {{ data.method }}
              </el-tag>
            </div>
            
            <div class="node-actions" v-if="data.type === 'collection'">
              <el-dropdown @command="(command) => handleAction(command, data)">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="add-request">
                      <el-icon><Plus /></el-icon>
                      添加请求
                    </el-dropdown-item>
                    <el-dropdown-item command="add-folder">
                      <el-icon><FolderAdd /></el-icon>
                      添加文件夹
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑集合
                    </el-dropdown-item>
                    <el-dropdown-item command="duplicate">
                      <el-icon><CopyDocument /></el-icon>
                      复制集合
                    </el-dropdown-item>
                    <el-dropdown-item command="export">
                      <el-icon><Download /></el-icon>
                      导出集合
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除集合
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>
      </el-tree>
    </div>
    
    <div v-if="collections.length === 0" class="empty-state">
      <el-empty description="暂无集合">
        <el-button type="primary" @click="$emit('create-collection')">
          创建第一个集合
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Folder,
  Document,
  MoreFilled,
  FolderAdd,
  Edit,
  CopyDocument,
  Download,
  Delete
} from '@element-plus/icons-vue'

interface ApiCollection {
  id: string
  name: string
  description?: string
  requests: ApiRequest[]
  folders?: ApiFolder[]
}

interface ApiRequest {
  id: string
  name: string
  method: string
  url: string
  headers?: Record<string, string>
  body?: any
}

interface ApiFolder {
  id: string
  name: string
  requests: ApiRequest[]
}

interface TreeNode {
  id: string
  label: string
  type: 'collection' | 'folder' | 'request'
  method?: string
  children?: TreeNode[]
  data?: any
}

interface Props {
  collections: ApiCollection[]
}

const props = defineProps<Props>()

defineEmits<{
  'select-request': [request: any, name: string]
  'create-collection': []
  'edit-collection': [collection: ApiCollection]
  'delete-collection': [collectionId: string]
}>()

const treeProps = {
  children: 'children',
  label: 'label'
}

const treeData = computed(() => {
  return props.collections.map(collection => ({
    id: collection.id,
    label: collection.name,
    type: 'collection' as const,
    data: collection,
    children: [
      ...(collection.folders || []).map(folder => ({
        id: folder.id,
        label: folder.name,
        type: 'folder' as const,
        children: folder.requests.map(request => ({
          id: request.id,
          label: request.name,
          type: 'request' as const,
          method: request.method,
          data: request
        }))
      })),
      ...collection.requests.map(request => ({
        id: request.id,
        label: request.name,
        type: 'request' as const,
        method: request.method,
        data: request
      }))
    ]
  }))
})

const getMethodTagType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info'
  }
  return types[method] || 'info'
}

const handleNodeClick = (data: TreeNode) => {
  if (data.type === 'request') {
    const request = {
      url: data.data.url,
      method: data.data.method,
      headers: data.data.headers || {},
      body: data.data.body
    }
    // Emit select-request event
    // $emit('select-request', request, data.label)
  }
}

const handleAction = async (command: string, collection: ApiCollection) => {
  switch (command) {
    case 'add-request':
      ElMessage.info('添加请求功能待实现')
      break
    case 'add-folder':
      ElMessage.info('添加文件夹功能待实现')
      break
    case 'edit':
      // $emit('edit-collection', collection)
      break
    case 'duplicate':
      ElMessage.info('复制集合功能待实现')
      break
    case 'export':
      exportCollection(collection)
      break
    case 'delete':
      await confirmDelete(collection)
      break
  }
}

const exportCollection = (collection: ApiCollection) => {
  const data = JSON.stringify(collection, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${collection.name}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('集合已导出')
}

const confirmDelete = async (collection: ApiCollection) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除集合 "${collection.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    // $emit('delete-collection', collection.id)
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.collection-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tree-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.tree-content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.tree-node:hover {
  background-color: #f5f7fa;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-label {
  font-size: 14px;
  color: #303133;
}

.method-tag {
  margin-left: auto;
  margin-right: 8px;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.empty-state {
  padding: 20px;
  text-align: center;
}

:deep(.el-tree-node__content) {
  padding: 0 !important;
}

:deep(.el-tree-node__expand-icon) {
  margin-right: 8px;
}
</style>