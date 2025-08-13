<template>
  <div class="team-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">团队协作</h1>
        <p class="page-description">管理团队成员、权限和协作设置</p>
      </div>
      <div class="header-actions">
        <button 
          @click="showInviteModal = true"
          class="btn btn-primary"
        >
          <UserFilled class="w-4 h-4 mr-2" />
          邀请成员
        </button>
      </div>
    </div>

    <!-- 团队统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <User class="w-6 h-6 text-blue-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ teamStore.members.length }}</div>
          <div class="stat-label">团队成员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <Lock class="w-6 h-6 text-green-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ adminCount }}</div>
          <div class="stat-label">管理员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <Clock class="w-6 h-6 text-orange-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ pendingInvitesCount }}</div>
          <div class="stat-label">待处理邀请</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <TrendCharts class="w-6 h-6 text-purple-500" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ activeCount }}</div>
          <div class="stat-label">活跃成员</div>
        </div>
      </div>
    </div>

    <!-- 成员列表 -->
    <div class="members-section">
      <div class="section-header">
        <h2 class="section-title">团队成员</h2>
        <div class="section-actions">
          <div class="search-box">
            <Search class="w-4 h-4 text-gray-400" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="搜索成员..."
              class="search-input"
            />
          </div>
          <select v-model="roleFilter" class="filter-select">
            <option value="">所有角色</option>
            <option value="admin">管理员</option>
            <option value="editor">编辑者</option>
            <option value="viewer">查看者</option>
          </select>
        </div>
      </div>

      <div class="members-table">
        <div class="table-header">
          <div class="header-cell">成员</div>
          <div class="header-cell">角色</div>
          <div class="header-cell">状态</div>
          <div class="header-cell">最后活跃</div>
          <div class="header-cell">操作</div>
        </div>
        <div class="table-body">
          <div 
            v-for="member in filteredMembers" 
            :key="member.id"
            class="table-row"
          >
            <div class="member-info">
              <div class="member-avatar">
                <img 
                  v-if="member.avatar" 
                  :src="member.avatar" 
                  :alt="member.name"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ member.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="member-details">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-email">{{ member.email }}</div>
              </div>
            </div>
            <div class="member-role">
              <select 
                v-if="canEditRole(member)"
                v-model="member.role"
                @change="updateMemberRole(member)"
                class="role-select"
              >
                <option value="admin">管理员</option>
                <option value="editor">编辑者</option>
                <option value="viewer">查看者</option>
              </select>
              <span v-else class="role-badge" :class="`role-${member.role}`">
                {{ getRoleLabel(member.role) }}
              </span>
            </div>
            <div class="member-status">
              <span class="status-badge" :class="`status-${member.status}`">
                {{ getStatusLabel(member.status) }}
              </span>
            </div>
            <div class="member-activity">
              {{ formatLastActive(member.lastActive) }}
            </div>
            <div class="member-actions">
              <button 
                v-if="canRemoveMember(member)"
                @click="removeMember(member)"
                class="action-btn danger"
                title="移除成员"
              >
                <Remove class="w-4 h-4" />
              </button>
              <button 
                @click="viewMemberDetails(member)"
                class="action-btn"
                title="查看详情"
              >
                <View class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请历史 -->
    <div class="invites-section">
      <div class="section-header">
        <h2 class="section-title">邀请历史</h2>
      </div>
      <div class="invites-list">
        <div 
          v-for="invite in teamStore.invites" 
          :key="invite.id"
          class="invite-item"
        >
          <div class="invite-info">
            <div class="invite-email">{{ invite.email }}</div>
            <div class="invite-role">{{ getRoleLabel(invite.role) }}</div>
          </div>
          <div class="invite-status">
            <span class="status-badge" :class="`status-${invite.status}`">
              {{ getInviteStatusLabel(invite.status) }}
            </span>
          </div>
          <div class="invite-date">
            {{ formatDate(invite.createdAt) }}
          </div>
          <div class="invite-actions">
            <button 
              v-if="invite.status === 'pending'"
              @click="resendInvite(invite)"
              class="action-btn"
              title="重新发送"
            >
              <Refresh class="w-4 h-4" />
            </button>
            <button 
              @click="cancelInvite(invite)"
              class="action-btn danger"
              title="取消邀请"
            >
              <Close class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请成员模态框 -->
    <div v-if="showInviteModal" class="modal-overlay" @click="showInviteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">邀请团队成员</h3>
          <button @click="showInviteModal = false" class="modal-close">
            <Close class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="sendInvite">
            <div class="form-group">
              <label class="form-label">邮箱地址</label>
              <input 
                v-model="inviteForm.email"
                type="email" 
                required
                class="form-input"
                placeholder="输入邮箱地址"
              />
            </div>
            <div class="form-group">
              <label class="form-label">角色权限</label>
              <select v-model="inviteForm.role" class="form-select">
                <option value="viewer">查看者 - 只能查看</option>
                <option value="editor">编辑者 - 可以编辑</option>
                <option value="admin">管理员 - 完全权限</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">邀请消息（可选）</label>
              <textarea 
                v-model="inviteForm.message"
                class="form-textarea"
                placeholder="添加邀请消息..."
                rows="3"
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="showInviteModal = false" class="btn btn-secondary">
                取消
              </button>
              <button type="submit" class="btn btn-primary">
                发送邀请
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  User, 
  UserFilled, 
  Remove, 
  Lock, 
  Clock, 
  TrendCharts, 
  Search, 
  View, 
  Refresh, 
  Close 
} from '@element-plus/icons-vue'
import { useTeamStore, type InviteForm } from '@/stores/team'

const teamStore = useTeamStore()

// 响应式数据
const showInviteModal = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const inviteForm = ref<InviteForm>({
  email: '',
  role: 'viewer',
  message: ''
})

// 计算属性
const adminCount = computed(() => 
  teamStore.members.filter(m => m.role === 'admin').length
)

const pendingInvitesCount = computed(() => 
  teamStore.invites.filter(i => i.status === 'pending').length
)

const activeCount = computed(() => 
  teamStore.members.filter(m => m.status === 'active').length
)

const filteredMembers = computed(() => {
  let filtered = teamStore.members
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.email.toLowerCase().includes(query)
    )
  }
  
  if (roleFilter.value) {
    filtered = filtered.filter(m => m.role === roleFilter.value)
  }
  
  return filtered
})

// 方法
const canEditRole = (member: any) => {
  return teamStore.currentUser?.role === 'admin' && member.id !== teamStore.currentUser?.id
}

const canRemoveMember = (member: any) => {
  return teamStore.currentUser?.role === 'admin' && member.id !== teamStore.currentUser?.id
}

const getRoleLabel = (role: string) => {
  const labels = {
    admin: '管理员',
    editor: '编辑者',
    viewer: '查看者'
  }
  return labels[role as keyof typeof labels] || role
}

const getStatusLabel = (status: string) => {
  const labels = {
    active: '活跃',
    inactive: '非活跃',
    pending: '待激活'
  }
  return labels[status as keyof typeof labels] || status
}

const getInviteStatusLabel = (status: string) => {
  const labels = {
    pending: '待接受',
    accepted: '已接受',
    expired: '已过期',
    cancelled: '已取消'
  }
  return labels[status as keyof typeof labels] || status
}

const formatLastActive = (date: string) => {
  const now = new Date()
  const lastActive = new Date(date)
  const diff = now.getTime() - lastActive.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return `${Math.floor(days / 30)}个月前`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const updateMemberRole = async (member: any) => {
  await teamStore.updateMemberRole(member.id, member.role)
}

const removeMember = async (member: any) => {
  if (confirm(`确定要移除成员 ${member.name} 吗？`)) {
    await teamStore.removeMember(member.id)
  }
}

const viewMemberDetails = (member: any) => {
  // 查看成员详情逻辑
  console.log('查看成员详情:', member)
}

const sendInvite = async () => {
  await teamStore.inviteMember(inviteForm.value)
  showInviteModal.value = false
  inviteForm.value = {
    email: '',
    role: 'viewer',
    message: ''
  }
}

const resendInvite = async (invite: any) => {
  await teamStore.resendInvite(invite.id)
}

const cancelInvite = async (invite: any) => {
  if (confirm('确定要取消这个邀请吗？')) {
    await teamStore.cancelInvite(invite.id)
  }
}

// 生命周期
onMounted(() => {
  teamStore.loadMembers()
  teamStore.loadInvites()
})
</script>

<style scoped>
.team-management {
  @apply p-8 max-w-7xl mx-auto;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  margin: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.4);
  min-height: calc(100vh - 160px);
  position: relative;
  overflow: hidden;
}

.team-management::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.page-header {
  @apply flex justify-between items-start mb-10 relative z-10;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
}

.header-content {
  @apply flex-1;
}

.page-title {
  @apply text-4xl font-bold mb-3;
  background: linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 2px;
}

.page-description {
  @apply text-lg text-slate-600 font-medium;
  margin-top: 12px;
}

.header-actions {
  @apply flex gap-4 relative z-10;
}

.btn {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  border: 1px solid transparent;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
  @apply text-white;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4), 0 4px 16px rgba(139, 92, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 40px rgba(59, 130, 246, 0.5), 0 6px 20px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #0891b2 100%);
}

.btn-secondary {
  background: rgba(248, 250, 252, 0.9);
  @apply text-slate-700;
  border-color: rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(241, 245, 249, 0.95);
  border-color: rgba(203, 213, 225, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 relative z-10;
}

.stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  @apply rounded-2xl p-8 flex items-center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px) saturate(180%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  @apply w-16 h-16 rounded-2xl flex items-center justify-center mr-6;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
  color: white;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4), 0 4px 16px rgba(139, 92, 246, 0.3);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 12px 40px rgba(59, 130, 246, 0.5), 0 6px 20px rgba(139, 92, 246, 0.4);
}

.stat-content {
  @apply flex-1 relative z-10;
}

.stat-value {
  @apply text-3xl font-bold mb-2;
  background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  @apply text-base text-slate-600 font-medium;
}

.members-section {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  @apply rounded-2xl p-8 mb-10 relative z-10;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px) saturate(180%);
  position: relative;
  overflow: hidden;
}

.members-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.section-header {
  @apply flex justify-between items-center mb-8 relative z-10;
  padding: 24px 32px;
  border-bottom: 2px solid rgba(226, 232, 240, 0.6);
}

.section-title {
  @apply text-2xl font-bold;
  background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 2px;
}

.section-actions {
  @apply flex gap-4;
}

.search-box {
  @apply relative flex items-center rounded-xl px-4 py-3 w-80;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.search-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.search-box:focus-within {
  background: rgba(255, 255, 255, 0.95);
  border-color: #3b82f6;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2), 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.search-box:focus-within::before {
  opacity: 1;
}

.search-input {
  @apply bg-transparent border-none outline-none flex-1 ml-3 text-slate-700 font-medium;
  position: relative;
  z-index: 1;
}

.search-input::placeholder {
  @apply text-slate-400;
}

.search-box svg {
  @apply text-slate-400;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.search-box:focus-within svg {
  @apply text-blue-500;
}

.filter-select {
  @apply px-4 py-3 rounded-xl font-medium text-slate-700;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-select:focus {
  background: rgba(255, 255, 255, 0.95);
  border-color: #3b82f6;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2), 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
  outline: none;
}

.members-table {
  @apply overflow-hidden relative z-10;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.table-header {
  @apply grid grid-cols-5 gap-4 px-8 py-6 text-sm font-bold text-slate-700;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid rgba(226, 232, 240, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-body {
  @apply divide-y divide-gray-200;
}

.table-row {
  @apply grid grid-cols-5 gap-4 px-8 py-6 border-b border-slate-100 transition-all duration-300;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

.table-row:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.table-row:last-child {
  border-bottom: none;
}

.member-info {
  @apply flex items-center;
}

.member-avatar {
  @apply mr-4;
}

.avatar-img {
  @apply w-12 h-12 rounded-2xl object-cover;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.table-row:hover .avatar-img {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
}

.avatar-placeholder {
  @apply w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-lg;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.table-row:hover .avatar-placeholder {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
}

.member-details {
  @apply flex-1;
}

.member-name {
  @apply font-bold text-slate-900 text-lg mb-1;
}

.member-email {
  @apply text-sm text-slate-500 font-medium;
}

.role-select {
  @apply px-4 py-2 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.role-select:focus {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
}

.role-badge {
  @apply px-4 py-2 rounded-xl text-sm font-bold backdrop-filter backdrop-blur-sm;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.role-badge:hover {
  transform: translateY(-2px) scale(1.05);
}

.role-admin {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.role-editor {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.role-viewer {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.9) 0%, rgba(75, 85, 99, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(107, 114, 128, 0.3);
}

.status-badge {
  @apply px-4 py-2 rounded-xl text-sm font-bold backdrop-filter backdrop-blur-sm;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.status-badge:hover {
  transform: translateY(-2px) scale(1.05);
}

.status-active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.status-inactive {
  background: linear-gradient(135deg, rgba(156, 163, 175, 0.9) 0%, rgba(107, 114, 128, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(156, 163, 175, 0.3);
}

.status-pending {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.status-accepted {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.status-expired {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.status-cancelled {
  background: linear-gradient(135deg, rgba(156, 163, 175, 0.9) 0%, rgba(107, 114, 128, 0.8) 100%);
  @apply text-white;
  box-shadow: 0 4px 16px rgba(156, 163, 175, 0.3);
}

.member-actions {
  @apply flex gap-3;
}

.action-btn {
  @apply p-3 text-slate-600 rounded-xl transition-all duration-300;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.6);
  backdrop-filter: blur(8px);
}

.action-btn:hover {
  @apply text-slate-900;
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-btn.danger {
  @apply text-red-500;
}

.action-btn.danger:hover {
  @apply text-white;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.8) 100%);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.invites-section {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  @apply rounded-2xl p-8 relative z-10;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px) saturate(180%);
  position: relative;
  overflow: hidden;
}

.invites-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.invites-list {
  @apply divide-y divide-gray-200 relative z-10;
}

.invite-item {
  @apply flex items-center justify-between p-6 border-b border-slate-100 last:border-b-0 transition-all duration-300;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.invite-item:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.invite-item:last-child {
  margin-bottom: 0;
}

.invite-info {
  @apply flex-1 relative z-10;
}

.invite-email {
  @apply font-bold text-slate-900 text-lg mb-1;
}

.invite-role {
  @apply text-sm text-slate-600 font-medium mb-1;
}

.invite-date {
  @apply text-sm text-slate-500 font-medium mr-4;
}

.invite-actions {
  @apply flex gap-3 relative z-10;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full mx-4;
}

.modal-header {
  @apply flex justify-between items-center p-6 border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close {
  @apply p-1 hover:bg-gray-100 rounded-lg transition-colors;
}

.modal-body {
  @apply p-6;
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none;
}

.form-actions {
  @apply flex justify-end gap-3 mt-6;
}
</style>