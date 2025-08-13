<template>
  <div class="team-page">
    <PageHeader title="团队管理" subtitle="管理团队成员和权限">
      <template #actions>
        <el-button @click="showInviteDialog = true" type="primary" size="small">
          邀请成员
        </el-button>
        <el-button @click="showSettingsDialog = true" size="small">
          团队设置
        </el-button>
      </template>
    </PageHeader>
    
    <div class="team-content">
      <!-- 团队概览 -->
      <div class="team-overview">
        <div class="team-info">
          <div class="team-avatar">
            <el-avatar :size="60" :src="currentTeam?.avatar">
              {{ currentTeam?.name?.charAt(0) }}
            </el-avatar>
          </div>
          <div class="team-details">
            <h2>{{ currentTeam?.name }}</h2>
            <p>{{ currentTeam?.description }}</p>
            <div class="team-stats">
              <span>{{ members.length }} 成员</span>
              <span>0 工作空间</span>
              <span v-if="currentTeam?.createdAt">创建于 {{ formatDate(currentTeam.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="team-actions">
          <el-button @click="copyInviteLink" size="small">
            复制邀请链接
          </el-button>
          <el-button @click="exportTeamData" size="small">
            导出数据
          </el-button>
        </div>
      </div>
      
      <!-- 成员列表 -->
      <div class="members-section">
        <div class="section-header">
          <h3>团队成员</h3>
          <div class="section-actions">
            <el-input
              v-model="memberSearch"
              placeholder="搜索成员"
              size="small"
              style="width: 200px"
              :prefix-icon="Search"
            />
            <el-select v-model="roleFilter" placeholder="角色筛选" size="small" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="所有者" value="owner" />
              <el-option label="管理员" value="admin" />
              <el-option label="编辑者" value="editor" />
              <el-option label="查看者" value="viewer" />
            </el-select>
          </div>
        </div>
        
        <div class="members-grid">
          <div
            v-for="member in filteredMembers"
            :key="member.id"
            class="member-card"
          >
            <div class="member-avatar">
              <el-avatar :src="member.avatar">
                {{ member.name.charAt(0) }}
              </el-avatar>
              <div class="member-status" :class="{ online: isOnline(member) }"></div>
            </div>
            
            <div class="member-info">
              <h4>{{ member.name }}</h4>
              <p>{{ member.email }}</p>
              <el-tag :type="getRoleType(member.role)" size="small">
                {{ getRoleLabel(member.role) }}
              </el-tag>
            </div>
            
            <div class="member-meta">
              <p>加入时间: {{ formatDate(member.joinedAt) }}</p>
              <p v-if="member.lastActiveAt">
                最后活跃: {{ formatRelativeTime(member.lastActiveAt) }}
              </p>
            </div>
            
            <div class="member-actions">
              <el-dropdown @command="handleMemberAction">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'edit', member }">
                      编辑权限
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'message', member }">
                      发送消息
                    </el-dropdown-item>
                    <el-dropdown-item 
                      :command="{ action: 'remove', member }"
                      divided
                      v-if="member.role !== 'owner'"
                    >
                      移除成员
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 权限管理 -->
      <div class="permissions-section">
        <div class="section-header">
          <h3>权限管理</h3>
          <el-button @click="showPermissionsDialog = true" size="small">
            管理权限
          </el-button>
        </div>
        
        <PermissionsMatrix :permissions="permissionsForMatrix" />
      </div>
      
      <!-- 活动日志 -->
      <div class="activity-section">
        <div class="section-header">
          <h3>活动日志</h3>
          <el-button @click="loadActivityLog" size="small">
            刷新
          </el-button>
        </div>
        
        <ActivityTimeline :activities="activities" :loading="activityLoading" />
      </div>
    </div>
    
    <!-- 邀请成员对话框 -->
    <InviteMemberDialog
      v-model="showInviteDialog"
      :team="currentTeam"
      @invite="handleInviteMember"
    />
    
    <!-- 团队设置对话框 -->
    <TeamSettingsDialog
      v-model="showSettingsDialog"
      :team="currentTeam"
      @save="handleSaveTeamSettings"
    />
    
    <!-- 权限管理对话框 -->
    <PermissionsDialog
      v-model="showPermissionsDialog"
      :member="editingMember"
      @save="handleSavePermissions"
    />
    
    <!-- 编辑成员对话框 -->
    <EditMemberDialog
      v-model="showEditMemberDialog"
      :member="editingMember"
      :current-user-role="'admin'"
      @save="handleSaveMember"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, MoreFilled } from '@element-plus/icons-vue'
import PageHeader from '../components/common/PageHeader.vue'
import PermissionsMatrix from '../components/team/PermissionsMatrix.vue'
import ActivityTimeline from '../components/team/ActivityTimeline.vue'
import InviteMemberDialog from '../components/team/InviteMemberDialog.vue'
import TeamSettingsDialog from '../components/team/TeamSettingsDialog.vue'
import PermissionsDialog from '../components/team/PermissionsDialog.vue'
import EditMemberDialog from '../components/team/EditMemberDialog.vue'
import { useTeamStore } from '../stores/team'
import type { TeamMember } from '@/types'

// 本地格式化函数
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString()
}

const formatRelativeTime = (date: string | Date) => {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

const teamStore = useTeamStore()

const memberSearch = ref('')
const roleFilter = ref('')
const showInviteDialog = ref(false)
const showSettingsDialog = ref(false)
const showPermissionsDialog = ref(false)
const showEditMemberDialog = ref(false)
const editingMember = ref<TeamMember | null>(null)
const activityLoading = ref(false)

const currentTeam = computed(() => teamStore.currentTeam)
const members = computed(() => teamStore.members)
// const workspaces = computed(() => teamStore.workspaces) // 暂时注释掉，teamStore中没有workspaces
// 为PermissionsMatrix组件适配权限数据格式
const permissionsForMatrix = computed(() => {
  // 创建基础权限列表
  return [
    { key: 'read', name: '查看', description: '查看团队信息和数据' },
    { key: 'write', name: '编辑', description: '编辑和修改数据' },
    { key: 'delete', name: '删除', description: '删除数据和资源' },
    { key: 'admin', name: '管理', description: '管理团队设置' },
    { key: 'invite', name: '邀请', description: '邀请新成员' },
    { key: 'manage_team', name: '团队管理', description: '管理团队成员' },
    { key: 'manage_billing', name: '账单管理', description: '管理付费和账单' }
  ]
})
const activities = computed(() => teamStore.activities)

const filteredMembers = computed(() => {
  let filtered = members.value
  
  if (memberSearch.value) {
    filtered = filtered.filter(member => 
      member.name.toLowerCase().includes(memberSearch.value.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearch.value.toLowerCase())
    )
  }
  
  if (roleFilter.value) {
    filtered = filtered.filter(member => member.role === roleFilter.value)
  }
  
  return filtered
})

onMounted(() => {
  teamStore.fetchTeamData()
  loadActivityLog()
})

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

// 判断成员是否在线（基于最后活跃时间）
const isOnline = (member: TeamMember) => {
  if (!member.lastActiveAt) return false
  const lastActive = new Date(member.lastActiveAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60)
  return diffMinutes < 30 // 30分钟内活跃视为在线
}

const handleMemberAction = async ({ action, member }: { action: string, member: TeamMember }) => {
  switch (action) {
    case 'edit':
      editingMember.value = member
      showEditMemberDialog.value = true
      break
      
    case 'message':
      // 发送消息功能
      ElMessage.info('消息功能开发中')
      break
      
    case 'remove':
      try {
        await ElMessageBox.confirm(
          `确定要移除成员 ${member.name} 吗？`,
          '确认移除',
          { type: 'warning' }
        )
        await teamStore.removeMember(member.id)
        ElMessage.success('成员已移除')
      } catch {
        // 用户取消
      }
      break
  }
}

const handleInviteMember = async (inviteData: any) => {
  try {
    await teamStore.inviteMembers(inviteData)
    ElMessage.success('邀请已发送')
  } catch (error) {
    ElMessage.error('邀请发送失败')
  }
}

const handleSaveTeamSettings = async (settings: any) => {
  try {
    await teamStore.updateTeamSettings(settings)
    ElMessage.success('团队设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSavePermissions = async (permissions: any) => {
  try {
    teamStore.updatePermissionsMatrix(permissions)
    ElMessage.success('权限设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveMember = async (memberData: any) => {
  try {
    await teamStore.updateMember(memberData.id, memberData)
    ElMessage.success('成员信息已更新')
    editingMember.value = null
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const copyInviteLink = async () => {
  try {
    const link = await teamStore.generateInviteLink()
    await navigator.clipboard.writeText(link)
    ElMessage.success('邀请链接已复制')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const exportTeamData = async () => {
  try {
    await teamStore.exportTeamData()
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const loadActivityLog = async () => {
  activityLoading.value = true
  try {
    await teamStore.loadActivityLog()
  } catch (error) {
    ElMessage.error('加载活动日志失败')
  } finally {
    activityLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.team-page {
  padding: 24px;
  
  .team-content {
    .team-overview {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .team-info {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .team-details {
          h2 {
            margin: 0 0 8px 0;
            color: #303133;
          }
          
          p {
            margin: 0 0 12px 0;
            color: #606266;
          }
          
          .team-stats {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: #909399;
          }
        }
      }
      
      .team-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .members-section,
    .permissions-section,
    .activity-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h3 {
          margin: 0;
          color: #303133;
        }
        
        .section-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
    
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      
      .member-card {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        padding: 16px;
        position: relative;
        
        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
        }
        
        .member-avatar {
          position: relative;
          margin-bottom: 12px;
          
          .member-status {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #c0c4cc;
            border: 2px solid white;
            
            &.online {
              background-color: #67c23a;
            }
          }
        }
        
        .member-info {
          margin-bottom: 12px;
          
          h4 {
            margin: 0 0 4px 0;
            color: #303133;
          }
          
          p {
            margin: 0 0 8px 0;
            color: #606266;
            font-size: 12px;
          }
        }
        
        .member-meta {
          margin-bottom: 12px;
          
          p {
            margin: 0 0 4px 0;
            font-size: 11px;
            color: #909399;
          }
        }
        
        .member-actions {
          position: absolute;
          top: 12px;
          right: 12px;
        }
      }
    }
  }
}
</style>