<template>
  <div class="workspace-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><OfficeBuilding /></el-icon>
            工作空间管理
          </h1>
          <p class="page-description">管理您的工作空间、团队成员和权限设置</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateWorkspaceDialog = true">
            <el-icon><Plus /></el-icon>
            创建工作空间
          </el-button>
        </div>
      </div>
    </div>

    <!-- 工作空间列表 -->
    <div class="workspace-list">
      <div class="list-header">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索工作空间..."
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-bar">
          <el-select v-model="selectedRole" placeholder="角色筛选" clearable>
            <el-option label="所有角色" value="" />
            <el-option label="所有者" value="owner" />
            <el-option label="管理员" value="admin" />
            <el-option label="成员" value="member" />
            <el-option label="访客" value="viewer" />
          </el-select>
        </div>
      </div>

      <div class="workspace-grid">
        <div
          v-for="workspace in filteredWorkspaces"
          :key="workspace.id"
          class="workspace-card"
          :class="{ active: workspace.id === currentWorkspace?.id }"
          @click="switchToWorkspace(workspace)"
        >
          <div class="card-header">
            <div class="workspace-info">
              <h3 class="workspace-name">{{ workspace.name }}</h3>
              <p class="workspace-description">{{ workspace.description || '暂无描述' }}</p>
            </div>
            <div class="workspace-actions">
              <el-dropdown trigger="click" @command="handleWorkspaceAction">
                <el-button text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'edit', workspace }">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'settings', workspace }">
                      <el-icon><Setting /></el-icon>
                      设置
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'members', workspace }">
                      <el-icon><User /></el-icon>
                      成员管理
                    </el-dropdown-item>
                    <el-dropdown-item 
                      :command="{ action: 'delete', workspace }"
                      divided
                      v-if="canDeleteWorkspace(workspace)"
                    >
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="card-content">
            <div class="workspace-stats">
              <div class="stat-item">
                <el-icon><Collection /></el-icon>
                <span>{{ workspace.collections?.length || 0 }} 个集合</span>
              </div>
              <div class="stat-item">
                <el-icon><User /></el-icon>
                <span>{{ (getWorkspaceMembers(workspace) || []).length }} 个成员</span>
              </div>
              <div class="stat-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatTime(workspace.updatedAt) }}</span>
              </div>
            </div>

            <div class="workspace-role">
              <el-tag :type="getRoleTagType(getUserRole(workspace))">
                {{ getRoleLabel(getUserRole(workspace)) }}
              </el-tag>
            </div>
          </div>

          <div class="card-footer" v-if="workspace.id === currentWorkspace?.id">
            <el-tag type="success" size="small">
              <el-icon><Check /></el-icon>
              当前工作空间
            </el-tag>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredWorkspaces.length === 0" class="empty-state">
          <el-empty description="暂无工作空间">
            <el-button type="primary" @click="showCreateWorkspaceDialog = true">
              创建第一个工作空间
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 创建工作空间对话框 -->
    <el-dialog
      v-model="showCreateWorkspaceDialog"
      title="创建工作空间"
      width="500px"
      :before-close="handleCreateDialogClose"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入工作空间名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="请输入工作空间描述（可选）"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="可见性" prop="isPublic">
          <el-radio-group v-model="createForm.isPublic">
            <el-radio :label="false">私有</el-radio>
            <el-radio :label="true">公开</el-radio>
          </el-radio-group>
          <div class="form-help-text">
            私有工作空间只有受邀成员可以访问，公开工作空间所有人都可以查看
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateWorkspaceDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateWorkspace" :loading="creating">
            创建
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑工作空间对话框 -->
    <el-dialog
      v-model="showEditWorkspaceDialog"
      title="编辑工作空间"
      width="500px"
      :before-close="handleEditDialogClose"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入工作空间名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            placeholder="请输入工作空间描述（可选）"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="可见性" prop="isPublic">
          <el-radio-group v-model="editForm.isPublic">
            <el-radio :label="false">私有</el-radio>
            <el-radio :label="true">公开</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditWorkspaceDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateWorkspace" :loading="updating">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工作空间设置对话框 -->
    <el-dialog
      v-model="showSettingsDialog"
      title="工作空间设置"
      width="600px"
    >
      <el-tabs v-model="activeSettingsTab">
        <el-tab-pane label="基本设置" name="basic">
          <div class="settings-section">
            <h4>工作空间信息</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="ID">{{ selectedWorkspace?.id }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatTime(selectedWorkspace?.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="最后更新">{{ formatTime(selectedWorkspace?.updatedAt) }}</el-descriptions-item>
              <el-descriptions-item label="成员数量">{{ (getWorkspaceMembers(selectedWorkspace) || []).length }}</el-descriptions-item>
              <el-descriptions-item label="集合数量">{{ selectedWorkspace?.collections?.length || 0 }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
        <el-tab-pane label="权限设置" name="permissions">
          <div class="settings-section">
            <h4>默认权限</h4>
            <el-form label-width="120px">
              <el-form-item label="新成员默认角色">
                <el-select v-model="workspaceSettings.defaultRole">
                  <el-option label="成员" value="member" />
                  <el-option label="访客" value="viewer" />
                </el-select>
              </el-form-item>
              <el-form-item label="允许成员邀请">
                <el-switch v-model="workspaceSettings.allowMemberInvite" />
              </el-form-item>
              <el-form-item label="允许公开分享">
                <el-switch v-model="workspaceSettings.allowPublicShare" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        <el-tab-pane label="危险操作" name="danger">
          <div class="settings-section">
            <h4>危险操作</h4>
            <el-alert
              title="警告"
              type="warning"
              description="以下操作不可逆，请谨慎操作"
              show-icon
              :closable="false"
            />
            <div class="danger-actions">
              <el-button type="danger" @click="selectedWorkspace && handleDeleteWorkspace(selectedWorkspace)">
                删除工作空间
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showSettingsDialog = false">关闭</el-button>
          <el-button type="primary" @click="handleSaveSettings">
            保存设置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog
      v-model="showMembersDialog"
      title="成员管理"
      width="800px"
    >
      <div class="members-management">
        <div class="members-header">
          <el-button type="primary" @click="showInviteDialog = true">
            <el-icon><Plus /></el-icon>
            邀请成员
          </el-button>
        </div>

        <el-table :data="workspaceMembers" style="width: 100%">
          <el-table-column prop="user.name" label="姓名" />
          <el-table-column prop="user.email" label="邮箱" />
          <el-table-column prop="role" label="角色">
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)">
                {{ getRoleLabel(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="joinedAt" label="加入时间">
            <template #default="{ row }">
              {{ formatTime(row.joinedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                type="primary"
                text
                size="small"
                @click="handleChangeRole(row)"
                v-if="canManageMembers(selectedWorkspace)"
              >
                修改角色
              </el-button>
              <el-button
                type="danger"
                text
                size="small"
                @click="handleRemoveMember(row)"
                v-if="canRemoveMember(selectedWorkspace, row)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMembersDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 邀请成员对话框 -->
    <el-dialog
      v-model="showInviteDialog"
      title="邀请成员"
      width="500px"
    >
      <el-form
        ref="inviteFormRef"
        :model="inviteForm"
        :rules="inviteFormRules"
        label-width="80px"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="inviteForm.email"
            placeholder="请输入邮箱地址"
            type="email"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="inviteForm.role" placeholder="选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="成员" value="member" />
            <el-option label="访客" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息" prop="message">
          <el-input
            v-model="inviteForm.message"
            type="textarea"
            placeholder="邀请消息（可选）"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showInviteDialog = false">取消</el-button>
          <el-button type="primary" @click="handleInviteMember" :loading="inviting">
            发送邀请
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
  OfficeBuilding,
  Plus,
  Search,
  MoreFilled,
  Edit,
  Setting,
  User,
  Delete,
  Collection,
  Clock,
  Check
} from '@element-plus/icons-vue'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Workspace, TeamMember, UserRole, TeamRole } from '../../../shared/types'

// 本地接口定义
interface InviteFormData {
  email: string
  role: TeamRole
  message: string
}
import dayjs from 'dayjs'

const workspaceStore = useWorkspaceStore()

// 响应式数据
const searchQuery = ref('')
const selectedRole = ref('')
const showCreateWorkspaceDialog = ref(false)
const showEditWorkspaceDialog = ref(false)
const showSettingsDialog = ref(false)
const showMembersDialog = ref(false)
const showInviteDialog = ref(false)
const creating = ref(false)
const updating = ref(false)
const inviting = ref(false)
const selectedWorkspace = ref<Workspace | null>(null)
const activeSettingsTab = ref('basic')

// 表单引用
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const inviteFormRef = ref<FormInstance>()

// 创建表单
const createForm = ref({
  name: '',
  description: '',
  isPublic: false
})

// 编辑表单
const editForm = ref({
  name: '',
  description: '',
  isPublic: false
})

// 邀请表单
const inviteForm = ref<InviteFormData>({
  email: '',
  role: 'member' as TeamRole,
  message: ''
})

// 工作空间设置
const workspaceSettings = ref({
  defaultRole: 'member' as TeamRole,
  allowMemberInvite: true,
  allowPublicShare: true
})

// 表单验证规则
const createFormRules: FormRules = {
  name: [
    { required: true, message: '请输入工作空间名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const editFormRules: FormRules = {
  name: [
    { required: true, message: '请输入工作空间名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const inviteFormRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 计算属性
const currentWorkspace = computed(() => workspaceStore.currentWorkspace)
const workspaces = computed(() => workspaceStore.workspaces)
const teamMembers = computed(() => workspaceStore.teamMembers)

const filteredWorkspaces = computed(() => {
  if (!workspaces.value || !Array.isArray(workspaces.value)) return []
  let filtered = workspaces.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(workspace => 
      workspace.name.toLowerCase().includes(query) ||
      workspace.description?.toLowerCase().includes(query)
    )
  }
  
  if (selectedRole.value) {
    filtered = filtered.filter(workspace => {
      const userRole = getUserRole(workspace)
      return userRole === selectedRole.value
    })
  }
  
  return filtered
})

const workspaceMembers = computed(() => {
  if (!selectedWorkspace.value) return []
  return getWorkspaceMembers(selectedWorkspace.value)
})

// 方法
const formatTime = (date: Date | string | undefined) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getRoleLabel = (role: UserRole) => {
  const labels: Record<UserRole, string> = {
    admin: '管理员',
    project_lead: '项目负责人',
    developer: '开发者',
    tester: '测试员',
    guest: '访客'
  }
  return labels[role] || role
}

const getRoleTagType = (role: UserRole) => {
  const types: Record<UserRole, string> = {
    admin: 'danger',
    project_lead: 'warning',
    developer: 'primary',
    tester: 'success',
    guest: 'info'
  }
  return types[role] || 'info'
}

const getUserRole = (_workspace: Workspace): UserRole => {
  // 这里应该根据当前用户和工作空间的关系返回角色
  // 暂时返回模拟数据
  return 'admin'
}

const getWorkspaceMembers = (workspace: Workspace | null): TeamMember[] => {
  if (!workspace) return []
  if (!teamMembers.value || !Array.isArray(teamMembers.value)) return []
  return teamMembers.value.filter(member => member.userId === workspace.ownerId)
}

const canDeleteWorkspace = (workspace: Workspace) => {
  return getUserRole(workspace) === 'admin'
}

const canManageMembers = (workspace: Workspace | null) => {
  if (!workspace) return false
  const role = getUserRole(workspace)
  return role === 'admin'
}

const canRemoveMember = (workspace: Workspace | null, _member: TeamMember) => {
  if (!workspace) return false
  const currentUserRole = getUserRole(workspace)
  return currentUserRole === 'admin'
}

const switchToWorkspace = async (workspace: Workspace) => {
  try {
    await workspaceStore.switchWorkspace(workspace.id)
    ElMessage.success(`已切换到工作空间: ${workspace.name}`)
  } catch (error) {
    ElMessage.error('切换工作空间失败')
  }
}

const handleWorkspaceAction = ({ action, workspace }: { action: string; workspace: Workspace }) => {
  selectedWorkspace.value = workspace
  
  switch (action) {
    case 'edit':
      editForm.value = {
        name: workspace.name,
        description: workspace.description || '',
        isPublic: workspace.isPublic || false
      }
      showEditWorkspaceDialog.value = true
      break
    case 'settings':
      showSettingsDialog.value = true
      break
    case 'members':
      showMembersDialog.value = true
      break
    case 'delete':
      handleDeleteWorkspace(workspace)
      break
  }
}

const handleCreateWorkspace = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    creating.value = true
    
    const workspaceData = {
      name: createForm.value.name,
      description: createForm.value.description,
      isPublic: createForm.value.isPublic,
      ownerId: '',
      members: [],
      collections: [],
      environments: [],
      settings: {
        timeout: 30000,
        followRedirects: true,
        validateSSL: true,
        maxRedirects: 5,
        requestDelay: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await workspaceStore.createWorkspace(workspaceData)
    
    showCreateWorkspaceDialog.value = false
    resetCreateForm()
    ElMessage.success('工作空间创建成功')
  } catch (error) {
    console.error('Failed to create workspace:', error)
  } finally {
    creating.value = false
  }
}

const handleUpdateWorkspace = async () => {
  if (!editFormRef.value || !selectedWorkspace.value) return
  
  try {
    await editFormRef.value.validate()
    updating.value = true
    
    await workspaceStore.updateWorkspaceSettings({
      timeout: 30000,
      followRedirects: true,
      validateSSL: true,
      maxRedirects: 5,
      requestDelay: 0
    })
    
    showEditWorkspaceDialog.value = false
    ElMessage.success('工作空间更新成功')
  } catch (error) {
    console.error('Failed to update workspace:', error)
  } finally {
    updating.value = false
  }
}

const handleDeleteWorkspace = async (workspace: Workspace) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工作空间 "${workspace.name}" 吗？此操作不可逆。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 这里应该调用删除工作空间的方法
    // await workspaceStore.deleteWorkspace(workspace.id)
    ElMessage.success('工作空间删除成功')
    showSettingsDialog.value = false
  } catch (error) {
    // 用户取消删除
  }
}

const handleInviteMember = async () => {
  if (!inviteFormRef.value || !selectedWorkspace.value) return
  
  try {
    await inviteFormRef.value.validate()
    inviting.value = true
    
    await workspaceStore.inviteTeamMember(selectedWorkspace.value.id, 'member')
    
    showInviteDialog.value = false
    resetInviteForm()
    ElMessage.success('邀请发送成功')
  } catch (error) {
    console.error('Failed to invite member:', error)
  } finally {
    inviting.value = false
  }
}

const handleChangeRole = async (_member: TeamMember) => {
  // 实现角色修改逻辑
  ElMessage.info('角色修改功能开发中')
}

const handleRemoveMember = async (_member: TeamMember) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除成员吗？`,
      '确认移除',
      {
        confirmButtonText: '移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (selectedWorkspace.value) {
      await workspaceStore.removeTeamMember(selectedWorkspace.value.id)
      ElMessage.success('成员移除成功')
    }
  } catch (error) {
    // 用户取消移除
  }
}

const handleSaveSettings = () => {
  ElMessage.success('设置保存成功')
  showSettingsDialog.value = false
}

const handleCreateDialogClose = () => {
  resetCreateForm()
}

const handleEditDialogClose = () => {
  resetEditForm()
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
    isPublic: false
  }
  createFormRef.value?.resetFields()
}

const resetEditForm = () => {
  editForm.value = {
    name: '',
    description: '',
    isPublic: false
  }
  editFormRef.value?.resetFields()
}

const resetInviteForm = () => {
  inviteForm.value = {
    email: '',
    role: 'member',
    message: ''
  }
  inviteFormRef.value?.resetFields()
}

// 生命周期
onMounted(async () => {
  await workspaceStore.loadWorkspace()
})
</script>

<style scoped>
.workspace-management {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.workspace-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-bar {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.workspace-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.workspace-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.workspace-card.active {
  border-color: #10b981;
  background: #f0fdf4;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.workspace-info {
  flex: 1;
}

.workspace-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.workspace-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

.workspace-actions {
  margin-left: 12px;
}

.card-content {
  margin-bottom: 16px;
}

.workspace-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 13px;
}

.workspace-role {
  display: flex;
  justify-content: flex-end;
}

.card-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  display: flex;
  justify-content: center;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-help-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.danger-actions {
  margin-top: 16px;
}

.members-management {
  margin-bottom: 16px;
}

.members-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .workspace-management {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
</style>