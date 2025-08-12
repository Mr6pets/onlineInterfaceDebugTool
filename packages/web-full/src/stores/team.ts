import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 类型定义
export interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
  joinedAt: string
  permissions: string[]
}

export interface TeamInvite {
  id: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  message?: string
  createdAt: string
  expiresAt: string
  invitedBy: string
}

export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: string
  settings: TeamSettings
}

export interface TeamSettings {
  allowInvites: boolean
  defaultRole: 'editor' | 'viewer'
  requireApproval: boolean
  maxMembers: number
}

export interface InviteForm {
  email: string
  role: 'admin' | 'editor' | 'viewer'
  message?: string
}

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

// 模拟存储
const storage = {
  getItem: (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null')
    } catch {
      return null
    }
  },
  setItem: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
  }
}

export const useTeamStore = defineStore('team', () => {
  // 状态
  const currentTeam = ref<Team | null>(null)
  const members = ref<TeamMember[]>([])
  const invites = ref<TeamInvite[]>([])
  const permissions = ref<Permission[]>([])
  const currentUser = ref<TeamMember | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isEditor = computed(() => ['admin', 'editor'].includes(currentUser.value?.role || ''))
  const canInvite = computed(() => isAdmin.value || currentTeam.value?.settings.allowInvites)
  const activeMembers = computed(() => members.value.filter(m => m.status === 'active'))
  const pendingInvites = computed(() => invites.value.filter(i => i.status === 'pending'))

  // 权限检查
  const hasPermission = (permission: string) => {
    return currentUser.value?.permissions.includes(permission) || false
  }

  const canEditMember = (memberId: string) => {
    if (!isAdmin.value) return false
    if (memberId === currentUser.value?.id) return false
    return true
  }

  const canRemoveMember = (memberId: string) => {
    if (!isAdmin.value) return false
    if (memberId === currentUser.value?.id) return false
    const member = members.value.find(m => m.id === memberId)
    if (member?.role === 'admin' && member.id === currentTeam.value?.ownerId) return false
    return true
  }

  // 团队管理
  const loadTeam = async (teamId: string) => {
    loading.value = true
    error.value = null
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const savedTeam = storage.getItem(`team_${teamId}`)
      if (savedTeam) {
        currentTeam.value = savedTeam
      } else {
        // 创建默认团队
        currentTeam.value = {
          id: teamId,
          name: '我的团队',
          description: '团队协作空间',
          ownerId: 'user_1',
          createdAt: new Date().toISOString(),
          settings: {
            allowInvites: true,
            defaultRole: 'viewer',
            requireApproval: false,
            maxMembers: 50
          }
        }
        storage.setItem(`team_${teamId}`, currentTeam.value)
      }
    } catch (err) {
      error.value = '加载团队信息失败'
      console.error('Load team error:', err)
    } finally {
      loading.value = false
    }
  }

  const updateTeamSettings = async (settings: Partial<TeamSettings>) => {
    if (!currentTeam.value) return
    
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      currentTeam.value.settings = { ...currentTeam.value.settings, ...settings }
      storage.setItem(`team_${currentTeam.value.id}`, currentTeam.value)
    } catch (err) {
      error.value = '更新团队设置失败'
      console.error('Update team settings error:', err)
    } finally {
      loading.value = false
    }
  }

  // 成员管理
  const loadMembers = async () => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const savedMembers = storage.getItem('team_members')
      if (savedMembers && savedMembers.length > 0) {
        members.value = savedMembers
      } else {
        // 创建默认成员数据
        members.value = [
          {
            id: 'user_1',
            name: '张三',
            email: 'zhangsan@example.com',
            avatar: '',
            role: 'admin',
            status: 'active',
            lastActive: new Date().toISOString(),
            joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            permissions: ['all']
          },
          {
            id: 'user_2',
            name: '李四',
            email: 'lisi@example.com',
            avatar: '',
            role: 'editor',
            status: 'active',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            permissions: ['read', 'write']
          },
          {
            id: 'user_3',
            name: '王五',
            email: 'wangwu@example.com',
            avatar: '',
            role: 'viewer',
            status: 'inactive',
            lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            permissions: ['read']
          }
        ]
        storage.setItem('team_members', members.value)
      }
      
      // 设置当前用户
      currentUser.value = members.value.find(m => m.id === 'user_1') || null
    } catch (err) {
      error.value = '加载成员列表失败'
      console.error('Load members error:', err)
    } finally {
      loading.value = false
    }
  }

  const updateMemberRole = async (memberId: string, role: TeamMember['role']) => {
    if (!canEditMember(memberId)) {
      error.value = '没有权限修改此成员'
      return
    }

    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const memberIndex = members.value.findIndex(m => m.id === memberId)
      if (memberIndex !== -1) {
        members.value[memberIndex].role = role
        // 更新权限
        if (role === 'admin') {
          members.value[memberIndex].permissions = ['all']
        } else if (role === 'editor') {
          members.value[memberIndex].permissions = ['read', 'write']
        } else {
          members.value[memberIndex].permissions = ['read']
        }
        storage.setItem('team_members', members.value)
      }
    } catch (err) {
      error.value = '更新成员角色失败'
      console.error('Update member role error:', err)
    } finally {
      loading.value = false
    }
  }

  const removeMember = async (memberId: string) => {
    if (!canRemoveMember(memberId)) {
      error.value = '没有权限移除此成员'
      return
    }

    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      members.value = members.value.filter(m => m.id !== memberId)
      storage.setItem('team_members', members.value)
    } catch (err) {
      error.value = '移除成员失败'
      console.error('Remove member error:', err)
    } finally {
      loading.value = false
    }
  }

  // 邀请管理
  const loadInvites = async () => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const savedInvites = storage.getItem('team_invites')
      if (savedInvites && savedInvites.length > 0) {
        invites.value = savedInvites
      } else {
        // 创建默认邀请数据
        invites.value = [
          {
            id: 'invite_1',
            email: 'newuser@example.com',
            role: 'viewer',
            status: 'pending',
            message: '欢迎加入我们的团队！',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            invitedBy: 'user_1'
          }
        ]
        storage.setItem('team_invites', invites.value)
      }
    } catch (err) {
      error.value = '加载邀请列表失败'
      console.error('Load invites error:', err)
    } finally {
      loading.value = false
    }
  }

  const inviteMember = async (inviteData: InviteForm) => {
    if (!canInvite.value) {
      error.value = '没有权限邀请成员'
      return
    }

    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 检查是否已经是成员
      const existingMember = members.value.find(m => m.email === inviteData.email)
      if (existingMember) {
        error.value = '该用户已经是团队成员'
        return
      }

      // 检查是否已经有待处理的邀请
      const existingInvite = invites.value.find(i => i.email === inviteData.email && i.status === 'pending')
      if (existingInvite) {
        error.value = '该用户已有待处理的邀请'
        return
      }

      const newInvite: TeamInvite = {
        id: `invite_${Date.now()}`,
        email: inviteData.email,
        role: inviteData.role,
        status: 'pending',
        message: inviteData.message,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invitedBy: currentUser.value?.id || ''
      }

      invites.value.push(newInvite)
      storage.setItem('team_invites', invites.value)
    } catch (err) {
      error.value = '发送邀请失败'
      console.error('Invite member error:', err)
    } finally {
      loading.value = false
    }
  }

  const resendInvite = async (inviteId: string) => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const inviteIndex = invites.value.findIndex(i => i.id === inviteId)
      if (inviteIndex !== -1) {
        invites.value[inviteIndex].createdAt = new Date().toISOString()
        invites.value[inviteIndex].expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        invites.value[inviteIndex].status = 'pending'
        storage.setItem('team_invites', invites.value)
      }
    } catch (err) {
      error.value = '重新发送邀请失败'
      console.error('Resend invite error:', err)
    } finally {
      loading.value = false
    }
  }

  const cancelInvite = async (inviteId: string) => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const inviteIndex = invites.value.findIndex(i => i.id === inviteId)
      if (inviteIndex !== -1) {
        invites.value[inviteIndex].status = 'cancelled'
        storage.setItem('team_invites', invites.value)
      }
    } catch (err) {
      error.value = '取消邀请失败'
      console.error('Cancel invite error:', err)
    } finally {
      loading.value = false
    }
  }

  const acceptInvite = async (inviteId: string) => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const invite = invites.value.find(i => i.id === inviteId)
      if (!invite || invite.status !== 'pending') {
        error.value = '邀请无效或已过期'
        return
      }

      // 创建新成员
      const newMember: TeamMember = {
        id: `user_${Date.now()}`,
        name: invite.email.split('@')[0],
        email: invite.email,
        role: invite.role,
        status: 'active',
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        permissions: invite.role === 'admin' ? ['all'] : invite.role === 'editor' ? ['read', 'write'] : ['read']
      }

      members.value.push(newMember)
      storage.setItem('team_members', members.value)

      // 更新邀请状态
      const inviteIndex = invites.value.findIndex(i => i.id === inviteId)
      if (inviteIndex !== -1) {
        invites.value[inviteIndex].status = 'accepted'
        storage.setItem('team_invites', invites.value)
      }
    } catch (err) {
      error.value = '接受邀请失败'
      console.error('Accept invite error:', err)
    } finally {
      loading.value = false
    }
  }

  // 权限管理
  const loadPermissions = async () => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      permissions.value = [
        { id: 'read', name: '查看', description: '查看工作空间和API', category: 'basic' },
        { id: 'write', name: '编辑', description: '创建和编辑API', category: 'basic' },
        { id: 'delete', name: '删除', description: '删除API和集合', category: 'basic' },
        { id: 'manage_env', name: '环境管理', description: '管理环境变量', category: 'advanced' },
        { id: 'manage_team', name: '团队管理', description: '管理团队成员', category: 'admin' },
        { id: 'manage_settings', name: '设置管理', description: '管理工作空间设置', category: 'admin' },
        { id: 'all', name: '完全权限', description: '所有权限', category: 'admin' }
      ]
    } catch (err) {
      error.value = '加载权限列表失败'
      console.error('Load permissions error:', err)
    } finally {
      loading.value = false
    }
  }

  // 清理数据
  const clearTeamData = () => {
    currentTeam.value = null
    members.value = []
    invites.value = []
    permissions.value = []
    currentUser.value = null
    error.value = null
  }

  return {
    // 状态
    currentTeam,
    members,
    invites,
    permissions,
    currentUser,
    loading,
    error,

    // 计算属性
    isAdmin,
    isEditor,
    canInvite,
    activeMembers,
    pendingInvites,

    // 权限检查
    hasPermission,
    canEditMember,
    canRemoveMember,

    // 团队管理
    loadTeam,
    updateTeamSettings,

    // 成员管理
    loadMembers,
    updateMemberRole,
    removeMember,

    // 邀请管理
    loadInvites,
    inviteMember,
    resendInvite,
    cancelInvite,
    acceptInvite,

    // 权限管理
    loadPermissions,

    // 工具方法
    clearTeamData
  }
})