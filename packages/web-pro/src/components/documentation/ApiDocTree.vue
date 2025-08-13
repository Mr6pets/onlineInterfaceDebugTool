<template>
  <div class="api-doc-tree">
    <div class="tree-toolbar">
      <el-button @click="expandAll" size="small" text>
        <el-icon><Expand /></el-icon>
        展开全部
      </el-button>
      <el-button @click="collapseAll" size="small" text>
        <el-icon><Fold /></el-icon>
        收起全部
      </el-button>
    </div>
    
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :expand-on-click-node="false"
      :default-expand-all="false"
      node-key="id"
      class="api-tree"
    >
      <template #default="{ node, data }">
        <div class="tree-node" :class="{ active: selectedNodeId === data.id }">
          <div class="node-content" @click="selectNode(data)">
            <el-icon class="node-icon" :class="getNodeIconClass(data.type)">
              <component :is="getNodeIcon(data.type)" />
            </el-icon>
            <span class="node-label">{{ data.name }}</span>
            <el-tag v-if="data.method" :type="getMethodType(data.method)" size="small" class="method-tag">
              {{ data.method }}
            </el-tag>
          </div>
          
          <div class="node-actions">
            <el-dropdown @command="handleNodeAction" trigger="click">
              <el-button size="small" text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="data.type === 'group'" :command="{ action: 'addGroup', node: data }">
                    添加子分组
                  </el-dropdown-item>
                  <el-dropdown-item v-if="data.type === 'group'" :command="{ action: 'addApi', node: data }">
                    添加接口
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'edit', node: data }">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'duplicate', node: data }" v-if="data.type === 'api'">
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete', node: data }" divided class="danger">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
    </el-tree>
    
    <!-- 添加分组对话框 -->
    <el-dialog v-model="showAddGroupDialog" title="添加分组" width="400px">
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="分组名称">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="groupForm.description" type="textarea" :rows="3" placeholder="请输入分组描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddGroupDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddGroup">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 添加API对话框 -->
    <el-dialog v-model="showAddApiDialog" title="添加接口" width="500px">
      <el-form :model="apiForm" label-width="80px">
        <el-form-item label="接口名称">
          <el-input v-model="apiForm.name" placeholder="请输入接口名称" />
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="apiForm.method" placeholder="选择请求方法">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口路径">
          <el-input v-model="apiForm.path" placeholder="/api/users" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="apiForm.description" type="textarea" :rows="3" placeholder="请输入接口描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddApiDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddApi">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Expand, Fold, MoreFilled, Folder, Document, Connection } from '@element-plus/icons-vue'
import type { ApiDocGroup, ApiDocItem } from '@/types'

interface Props {
  data: (ApiDocGroup | ApiDocItem)[]
  selectedNodeId?: string
}

interface Emits {
  'node-select': [node: ApiDocGroup | ApiDocItem]
  'add-group': [parentId: string, group: Partial<ApiDocGroup>]
  'add-api': [parentId: string, api: Partial<ApiDocItem>]
  'edit-node': [node: ApiDocGroup | ApiDocItem]
  'delete-node': [node: ApiDocGroup | ApiDocItem]
  'duplicate-api': [api: ApiDocItem]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const treeRef = ref()
const showAddGroupDialog = ref(false)
const showAddApiDialog = ref(false)
const currentParentId = ref('')

const groupForm = ref({
  name: '',
  description: ''
})

const apiForm = ref({
  name: '',
  method: 'GET',
  path: '',
  description: ''
})

const treeProps = {
  children: 'children',
  label: 'name'
}

const treeData = computed(() => props.data)

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'group':
      return Folder
    case 'api':
      return Connection
    default:
      return Document
  }
}

const getNodeIconClass = (type: string) => {
  return {
    'group-icon': type === 'group',
    'api-icon': type === 'api'
  }
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

const selectNode = (node: ApiDocGroup | ApiDocItem) => {
  emit('node-select', node)
}

const expandAll = () => {
  const nodes = treeRef.value?.store?.nodesMap
  if (nodes) {
    Object.values(nodes).forEach((node: any) => {
      node.expanded = true
    })
  }
}

const collapseAll = () => {
  const nodes = treeRef.value?.store?.nodesMap
  if (nodes) {
    Object.values(nodes).forEach((node: any) => {
      node.expanded = false
    })
  }
}

const handleNodeAction = ({ action, node }: { action: string; node: ApiDocGroup | ApiDocItem }) => {
  switch (action) {
    case 'addGroup':
      currentParentId.value = node.id
      groupForm.value = { name: '', description: '' }
      showAddGroupDialog.value = true
      break
    case 'addApi':
      currentParentId.value = node.id
      apiForm.value = { name: '', method: 'GET', path: '', description: '' }
      showAddApiDialog.value = true
      break
    case 'edit':
      emit('edit-node', node)
      break
    case 'duplicate':
      if (node.type === 'api') {
        emit('duplicate-api', node as ApiDocItem)
      }
      break
    case 'delete':
      ElMessageBox.confirm(
        `确定要删除 "${node.name}" 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        emit('delete-node', node)
        ElMessage.success('删除成功')
      }).catch(() => {})
      break
  }
}

const confirmAddGroup = () => {
  if (!groupForm.value.name) {
    ElMessage.warning('请输入分组名称')
    return
  }
  
  emit('add-group', currentParentId.value, groupForm.value)
  showAddGroupDialog.value = false
  ElMessage.success('分组添加成功')
}

const confirmAddApi = () => {
  if (!apiForm.value.name || !apiForm.value.path) {
    ElMessage.warning('请填写完整的接口信息')
    return
  }
  
  emit('add-api', currentParentId.value, apiForm.value)
  showAddApiDialog.value = false
  ElMessage.success('接口添加成功')
}
</script>

<style lang="scss" scoped>
.api-doc-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  gap: 8px;
}

.api-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  
  :deep(.el-tree-node__content) {
    height: auto;
    padding: 4px 0;
  }
  
  :deep(.el-tree-node__expand-icon) {
    padding: 4px;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f7fa;
    
    .node-actions {
      opacity: 1;
    }
  }
  
  &.active {
    background-color: #e6f7ff;
    border: 1px solid #91d5ff;
  }
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
}

.node-icon {
  &.group-icon {
    color: #faad14;
  }
  
  &.api-icon {
    color: #52c41a;
  }
}

.node-label {
  font-size: 14px;
  color: #303133;
}

.method-tag {
  margin-left: auto;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.danger {
  color: #f56c6c !important;
}
</style>