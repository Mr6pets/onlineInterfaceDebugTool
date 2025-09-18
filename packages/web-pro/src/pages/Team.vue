<template>
  <div class="team-page">
    <PageHeader
      title="团队协作"
      :breadcrumb="[
        { label: '首页', path: '/dashboard' },
        { label: '团队协作', path: '/team' }
      ]"
    >
      <template #actions>
        <el-button @click="showInviteDialog = true" type="primary" :icon="Plus">
          邀请成员
        </el-button>
        <el-button @click="showSettingsDialog = true" :icon="Setting">
          团队设置
        </el-button>
        <el-dropdown @command="handleExport">
          <el-button :icon="Download">
            导出数据
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="members">成员列表</el-dropdown-item>
              <el-dropdown-item command="permissions">权限报告</el-dropdown-item>
              <el-dropdown-item command="activity">活动日志</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </PageHeader>
    
    <div class="team-content">
      <!-- 团队概览 -->
      <div class="team-overview">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon">
                  <el-icon color="#409eff"><User /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-value">{{ teamStats.totalMembers }}</div>
                  <div class="card-label">团队成员</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon">
                  <el-icon color="#67c23a"><Folder /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-value">{{ teamStats.totalProjects }}</div>
                  <div class="card-label">活跃项目</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon">
                  <el-icon color="#e6a23c"><Calendar /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-value">{{ formatDate(teamStats.createdAt.toISOString()) }}</div>
                  <div class="card-label">创建时间</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon">
                  <el-icon color="#f56c6c"><TrendCharts /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-value">{{ teamStats.activityScore }}</div>
                  <div class="card-label">活跃度</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 主要内容区域 -->
      <el-row :gutter="24" class="main-content">
        <!-- 成员管理 -->
        <el-col :span="16">
          <el-card class="members-card">
            <template #header>
              <div class="card-header">
                <h3>团队成员</h3>
                <div class="header-actions">
                  <el-input
                    v-model="memberSearch"
                    placeholder="搜索成员"
                    :prefix-icon="Search"
                    style="width: 200px; margin-right: 12px"
                    clearable
                  />
                  <el-select v-model="roleFilter" placeholder="筛选角色" style="width: 120px">
                    <el-option label="全部" value="" />
                    <el-option label="所有者" value="owner" />
                    <el-option label="管理员" value="admin" />
                    <el-option label="编辑者" value="editor" />
                    <el-option label="查看者" value="viewer" />
                  </el-select>
                </div>
              </div>
            </template>
            
            <div class="members-list">
              <div 
                class="member-item" 
                v-for="member in filteredMembers" 
                :key="member.id"
              >
                <div class="member-info">
                  <el-avatar :src="member.avatar" :size="40">
                    {{ member.name.charAt(0) }}
                  </el-avatar>
                  <div class="member-details">
                    <div class="member-name">{{ member.name }}</div>
                    <div class="member-email">{{ member.email }}</div>
                    <div class="member-meta">
                      <el-tag :type="getRoleType(member.role)" size="small">
                        {{ getRoleLabel(member.role) }}
                      </el-tag>
                      <span class="member-status" :class="member.status">
                        {{ getStatusLabel(member.status) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="member-actions">
                  <el-dropdown @command="(command: string) => handleMemberAction(command, member)">
                    <el-button size="small" :icon="MoreFilled" circle />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                        <el-dropdown-item command="edit">编辑信息</el-dropdown-item>
                        <el-dropdown-item command="permissions">管理权限</el-dropdown-item>
                        <el-dropdown-item command="message">发送消息</el-dropdown-item>
                        <el-dropdown-item command="remove" divided>移除成员</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              
              <el-empty v-if="filteredMembers.length === 0" description="暂无成员数据" />
            </div>
            
            <!-- 分页 -->
            <div class="pagination-wrapper" v-if="totalMembers > pageSize">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="totalMembers"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-col>
        
        <!-- 侧边栏 -->
        <el-col :span="8">
          <!-- 权限矩阵 -->
          <el-card class="permissions-card" style="margin-bottom: 24px">
            <template #header>
              <h3>权限矩阵</h3>
            </template>
            <PermissionsMatrix
              :permissions="permissionsMatrix"
              @update="updatePermissions"
            />
          </el-card>
          
          <!-- 活动日志 -->
          <el-card class="activity-card">
            <template #header>
              <h3>最近活动</h3>
            </template>
            <ActivityTimeline
              :activities="recentActivities"
              :show-filters="false"
              :max-items="5"
              @load-more="loadMoreActivities"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 对话框组件 -->
    <InviteMemberDialog
      v-model="showInviteDialog"
      :team="currentTeam"
      @invite="handleInvite"
    />
    
    <TeamSettingsDialog
      v-model="showSettingsDialog"
      :team="currentTeam"
      @save="handleSettingsSave"
      @transfer="handleOwnershipTransfer"
      @delete="handleTeamDelete"
    />
    
    <PermissionsDialog
      v-model="showPermissionsDialog"
      :member="selectedMember"
      @save="handlePermissionsSave"
    />
    
    <EditMemberDialog
      v-model="showEditDialog"
      :member="selectedMember"
      :current-user-role="currentUserRole"
      @save="handleMemberSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Plus,
  Setting,
  Download,
  ArrowDown,
  Search,
  MoreFilled,
  Folder,
  Calendar,
  TrendCharts
} from '@element-plus/icons-vue'
import { useTeamStore } from '@/stores/team'
import PageHeader from '@/components/common/PageHeader.vue'
import PermissionsMatrix from '@/components/team/PermissionsMatrix.vue'
import ActivityTimeline from '@/components/team/ActivityTimeline.vue'
import InviteMemberDialog from '@/components/team/InviteMemberDialog.vue'
import TeamSettingsDialog from '@/components/team/TeamSettingsDialog.vue'
import PermissionsDialog from '@/components/team/PermissionsDialog.vue'
import EditMemberDialog from '@/components/team/EditMemberDialog.vue'
import type { TeamMember, Team, Permission } from '@/types'

const teamStore = useTeamStore()

// 响应式数据
const showInviteDialog = ref(false)
const showSettingsDialog = ref(false)
const showPermissionsDialog = ref(false)
const showEditDialog = ref(false)
const selectedMember = ref<TeamMember | null>(null)
const memberSearch = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 团队统计数据
const teamStats = ref({
  totalMembers: 12,
  totalProjects: 8,
  createdAt: new Date('2024-01-15'),
  activityScore: 85
})

// 当前团队信息
const currentTeam = ref<Team>({
  id: '1',
  name: '开发团队',
  description: '负责产品开发的核心团队',
  avatar: '',
  website: 'https://example.com',
  contactEmail: 'team@example.com',
  timezone: 'Asia/Shanghai',
  settings: {
    access: {
      visibility: 'private',
      requireApproval: true,
      invitePermissions: ['owner', 'admin'],
      allowedDomains: ''
    },
    notifications: {
      email: {
        memberJoined: true,
        memberLeft: true,
        roleChanged: true,
        projectCreated: false,
        weeklyReport: true
      },
      inApp: {
        mentions: true,
        comments: true,
        assignments: true,
        deadlines: true
      },
      frequency: 'realtime',
      quietHours: ['22:00', '08:00']
    }
  },
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString()
})

// 当前用户角色
const currentUserRole = ref('admin')

// 团队成员数据
const members = ref<TeamMember[]>([
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: '',
    role: 'owner',
    status: 'active',
    title: '技术总监',
    department: 'tech',
    joinedAt: '2024-01-15',
    permissions: ['team.read', 'team.invite', 'team.manage', 'project.create', 'project.delete']
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    avatar: '',
    role: 'admin',
    status: 'active',
    title: '前端工程师',
    department: 'tech',
    joinedAt: '2024-01-20',
    permissions: ['team.read', 'team.invite', 'project.create']
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    avatar: '',
    role: 'editor',
    status: 'active',
    title: '后端工程师',
    department: 'tech',
    joinedAt: '2024-02-01',
    permissions: ['team.read', 'project.create']
  }
])

// 权限矩阵数据
const permissionsMatrix = ref<Permission[]>([
  {
    key: 'read',
    name: '查看',
    description: '查看团队信息和数据',
    category: 'basic',
    roles: ['owner', 'admin', 'editor', 'viewer']
  },
  {
    key: 'write',
    name: '编辑',
    description: '编辑团队信息和数据',
    category: 'basic',
    roles: ['owner', 'admin', 'editor']
  },
  {
    key: 'delete',
    name: '删除',
    description: '删除团队数据',
    category: 'basic',
    roles: ['owner', 'admin']
  },
  {
    key: 'admin',
    name: '管理',
    description: '管理团队设置',
    category: 'admin',
    roles: ['owner']
  },
  {
    key: 'invite',
    name: '邀请',
    description: '邀请新成员',
    category: 'member',
    roles: ['owner', 'admin']
  },
  {
    key: 'manage_team',
    name: '团队管理',
    description: '管理团队成员和设置',
    category: 'admin',
    roles: ['owner', 'admin']
  },
  {
    key: 'manage_billing',
    name: '账单管理',
    description: '管理付费计划和账单',
    category: 'billing',
    roles: ['owner']
  }
])

// 最近活动数据
const recentActivities = ref([
  {
    id: '1',
    type: 'member_joined' as const,
    title: '邀请了新成员',
    description: '邀请李四加入团队，角色为管理员',
    userId: '1',
    userName: '张三',
    userAvatar: '',
    timestamp: '2024-03-15T10:30:00Z',
    teamId: '1'
  },
  {
    id: '2',
    type: 'member_joined' as const,
    title: '修改了权限',
    description: '将王五的角色从查看者升级为编辑者',
    userId: '1',
    userName: '张三',
    userAvatar: '',
    timestamp: '2024-03-14T15:20:00Z',
    teamId: '1'
  },
  {
    id: '3',
    type: 'project_created' as const,
    title: '创建了项目',
    description: '创建了新产品开发项目',
    userId: '2',
    userName: '李四',
    userAvatar: '',
    timestamp: '2024-03-13T09:15:00Z',
    teamId: '1'
  }
])

// 计算属性
const filteredMembers = computed(() => {
  let filtered = members.value
  
  // 搜索过滤
  if (memberSearch.value) {
    const search = memberSearch.value.toLowerCase()
    filtered = filtered.filter(member => 
      member.name.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search)
    )
  }
  
  // 角色过滤
  if (roleFilter.value) {
    filtered = filtered.filter(member => member.role === roleFilter.value)
  }
  
  return filtered
})

const totalMembers = computed(() => filteredMembers.value.length)

// 工具函数
const getRoleType = (role: string) => {
  const types: Record<string, string> = {
    owner: 'danger',
    admin: 'warning',
    editor: 'primary',
    viewer: 'info'
  }
  return types[role] || 'info'
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    owner: '所有者',
    admin: '管理员',
    editor: '编辑者',
    viewer: '查看者'
  }
  return labels[role] || role
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '活跃',
    suspended: '暂停',
    inactive: '停用'
  }
  return labels[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 事件处理函数
const handleMemberAction = (command: string, member: TeamMember) => {
  selectedMember.value = member
  
  switch (command) {
    case 'view':
      ElMessage.info(`查看 ${member.name} 的详情`)
      break
    case 'edit':
      showEditDialog.value = true
      break
    case 'permissions':
      showPermissionsDialog.value = true
      break
    case 'message':
      ElMessage.info(`发送消息给 ${member.name}`)
      break
    case 'remove':
      handleRemoveMember(member)
      break
  }
}

const handleRemoveMember = async (member: TeamMember) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除成员 ${member.name} 吗？此操作不可撤销。`,
      '确认移除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = members.value.findIndex(m => m.id === member.id)
    if (index > -1) {
      members.value.splice(index, 1)
      ElMessage.success(`已移除成员 ${member.name}`)
    }
  } catch {
    // 用户取消
  }
}

const handleInvite = (_: any) => {
  ElMessage.success('邀请发送成功')
  // 这里可以添加实际的邀请逻辑
}

const handleSettingsSave = (settings: any) => {
  if (settings.basic) {
    Object.assign(currentTeam.value, settings.basic)
  }
  if (currentTeam.value.settings) {
    if (settings.access) {
      Object.assign(currentTeam.value.settings, { access: settings.access })
    }
    if (settings.notifications) {
      Object.assign(currentTeam.value.settings, { notifications: settings.notifications })
    }
  }
  ElMessage.success('团队设置保存成功')
}

const handleOwnershipTransfer = (_: string) => {
  ElMessage.success('所有权转移成功')
}

const handleTeamDelete = () => {
  ElMessage.success('团队删除成功')
}

const handlePermissionsSave = (memberId: string, permissions: any) => {
  const member = members.value.find(m => m.id === memberId)
  if (member && permissions?.basic) {
    member.permissions = Object.keys(permissions.basic).filter(key => permissions.basic[key])
    ElMessage.success('权限保存成功')
  }
}

const handleMemberSave = (memberData: TeamMember) => {
  const index = members.value.findIndex(m => m.id === memberData.id)
  if (index > -1) {
    members.value[index] = { ...memberData }
    ElMessage.success('成员信息保存成功')
  }
}

const handleExport = (command: string) => {
  ElMessage.success(`导出${command === 'members' ? '成员列表' : command === 'permissions' ? '权限报告' : '活动日志'}成功`)
}

const updatePermissions = (newPermissions: Permission[]) => {
  permissionsMatrix.value = newPermissions
  ElMessage.success('权限矩阵更新成功')
}

const loadMoreActivities = () => {
  ElMessage.info('加载更多活动')
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
  teamStore.fetchTeamData()
})
</script>

<style lang="scss" scoped>
.team-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.team-content {
  margin-top: 24px;
}

.team-overview {
  margin-bottom: 24px;
  
  .overview-card {
    .card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: rgba(64, 158, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        
        .el-icon {
          font-size: 24px;
        }
      }
      
      .card-info {
        flex: 1;
        
        .card-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .card-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}

.main-content {
  .members-card, .permissions-card, .activity-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
      
      .header-actions {
        display: flex;
        align-items: center;
      }
    }
  }
}

.members-list {
  .member-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .member-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      
      .member-details {
        .member-name {
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .member-email {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }
        
        .member-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .member-status {
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 4px;
            
            &.active {
              background: #f0f9ff;
              color: #409eff;
            }
            
            &.suspended {
              background: #fdf6ec;
              color: #e6a23c;
            }
            
            &.inactive {
              background: #fef0f0;
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

// 响应式设计
@media (max-width: 1200px) {
  .main-content {
    .el-col {
      &:first-child {
        margin-bottom: 24px;
      }
    }
  }
}

@media (max-width: 768px) {
  .team-page {
    padding: 16px;
  }
  
  .team-overview {
    .el-col {
      margin-bottom: 12px;
    }
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
  
  .member-item {
    .member-info {
      .member-details {
        .member-meta {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
    }
  }
}
</style>