import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Team, TeamMember } from '@/types'

export const useTeamStore = defineStore('team', () => {
  // 状态
  const currentTeam = ref<Team | null>(null)
  const members = ref<TeamMember[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 团队统计
  const teamStats = ref({
    totalMembers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    createdAt: '',
    activityScore: 0
  })
  
  // 活动日志
  const activities = ref<any[]>([])
  
  // 权限矩阵
  const permissionsMatrix = ref({
    roles: ['owner', 'admin', 'editor', 'viewer'],
    permissions: ['read', 'write', 'delete', 'admin', 'invite', 'manage_team', 'manage_billing'],
    matrix: {
      owner: ['read', 'write', 'delete', 'admin', 'invite', 'manage_team', 'manage_billing'],
      admin: ['read', 'write', 'delete', 'invite', 'manage_team'],
      editor: ['read', 'write'],
      viewer: ['read']
    },
    inherited: {
      admin: ['read'],
      editor: ['read'],
      viewer: []
    }
  })
  
  // 计算属性
  const membersByRole = computed(() => {
    const grouped: Record<string, TeamMember[]> = {
      owner: [],
      admin: [],
      editor: [],
      viewer: []
    }
    
    members.value.forEach(member => {
      if (grouped[member.role]) {
        grouped[member.role].push(member)
      }
    })
    
    return grouped
  })
  
  const activeMembers = computed(() => {
    return members.value.filter(member => member.status === 'active')
  })
  
  const recentActivities = computed(() => {
    return activities.value
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  })
  
  // 方法
  const fetchTeamData = async () => {
    loading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟团队数据
      currentTeam.value = {
        id: '1',
        name: '开发团队',
        description: '负责产品开发的核心团队',
        avatar: '',
        website: 'https://example.com',
        contactEmail: 'team@example.com',
        timezone: 'Asia/Shanghai',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
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
        }
      }
      
      // 模拟成员数据
      members.value = [
        {
          id: '1',
          name: '张三',
          email: 'zhangsan@example.com',
          avatar: '',
          role: 'owner',
          status: 'active',
          title: '技术总监',
          department: 'tech',
          phone: '13800138001',
          location: '北京',
          joinedAt: '2024-01-15T00:00:00Z',
          lastActiveAt: '2024-03-15T10:30:00Z',
          permissions: ['team.read', 'team.invite', 'team.manage', 'project.create', 'project.delete', 'billing.view', 'billing.manage'],
          tags: ['核心成员', '技术专家'],
          notes: '团队创始人，负责技术架构设计'
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
          phone: '13800138002',
          location: '上海',
          joinedAt: '2024-01-20T00:00:00Z',
          lastActiveAt: '2024-03-15T09:15:00Z',
          permissions: ['team.read', 'team.invite', 'project.create', 'billing.view'],
          tags: ['前端专家'],
          notes: '负责前端架构和UI组件开发'
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
          phone: '13800138003',
          location: '深圳',
          joinedAt: '2024-02-01T00:00:00Z',
          lastActiveAt: '2024-03-14T16:45:00Z',
          permissions: ['team.read', 'project.create'],
          tags: ['后端专家', '数据库专家'],
          notes: '负责后端API开发和数据库设计'
        },
        {
          id: '4',
          name: '赵六',
          email: 'zhaoliu@example.com',
          avatar: '',
          role: 'viewer',
          status: 'active',
          title: '产品经理',
          department: 'product',
          phone: '13800138004',
          location: '杭州',
          joinedAt: '2024-02-15T00:00:00Z',
          lastActiveAt: '2024-03-15T08:20:00Z',
          permissions: ['team.read'],
          tags: ['产品专家'],
          notes: '负责产品需求分析和用户体验设计'
        }
      ]
      
      // 更新统计数据
      teamStats.value = {
        totalMembers: members.value.length,
        totalProjects: 8,
        activeProjects: 5,
        completedProjects: 3,
        createdAt: currentTeam.value.createdAt,
        activityScore: 85
      }
      
      // 模拟活动数据
      activities.value = [
        {
          id: '1',
          type: 'member',
          actor: { id: '1', name: '张三', avatar: '' },
          action: '邀请了新成员',
          target: '李四',
          timestamp: '2024-03-15T10:30:00Z',
          details: '邀请李四加入团队，角色为管理员'
        },
        {
          id: '2',
          type: 'permission',
          actor: { id: '1', name: '张三', avatar: '' },
          action: '修改了权限',
          target: '王五',
          timestamp: '2024-03-14T15:20:00Z',
          details: '将王五的角色从查看者升级为编辑者'
        },
        {
          id: '3',
          type: 'project',
          actor: { id: '2', name: '李四', avatar: '' },
          action: '创建了项目',
          target: '新产品开发',
          timestamp: '2024-03-13T09:15:00Z',
          details: '创建了新产品开发项目'
        },
        {
          id: '4',
          type: 'setting',
          actor: { id: '1', name: '张三', avatar: '' },
          action: '更新了团队设置',
          target: '通知配置',
          timestamp: '2024-03-12T14:30:00Z',
          details: '修改了邮件通知设置'
        }
      ]
      
    } catch (err) {
      error.value = '获取团队数据失败'
      console.error('Failed to fetch team data:', err)
    } finally {
      loading.value = false
    }
  }
  
  const addMember = async (memberData: Partial<TeamMember>) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: memberData.name || '',
        email: memberData.email || '',
        avatar: memberData.avatar || '',
        role: memberData.role || 'viewer',
        status: 'active',
        title: memberData.title || '',
        department: memberData.department || '',
        phone: memberData.phone || '',
        location: memberData.location || '',
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        permissions: memberData.permissions || ['team.read'],
        tags: memberData.tags || [],
        notes: memberData.notes || ''
      }
      
      members.value.push(newMember)
      teamStats.value.totalMembers = members.value.length
      
      // 添加活动记录
      activities.value.unshift({
        id: Date.now().toString(),
        type: 'member',
        actor: { id: '1', name: '当前用户', avatar: '' },
        action: '邀请了新成员',
        target: newMember.name,
        timestamp: new Date().toISOString(),
        details: `邀请${newMember.name}加入团队，角色为${newMember.role}`
      })
      
      return newMember
    } catch (err) {
      error.value = '添加成员失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateMember = async (memberId: string, updates: Partial<TeamMember>) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const index = members.value.findIndex(m => m.id === memberId)
      if (index > -1) {
        members.value[index] = { ...members.value[index], ...updates, updatedAt: new Date().toISOString() }
        
        // 添加活动记录
        activities.value.unshift({
          id: Date.now().toString(),
          type: 'member',
          actor: { id: '1', name: '当前用户', avatar: '' },
          action: '更新了成员信息',
          target: members.value[index].name,
          timestamp: new Date().toISOString(),
          details: '更新了成员的基本信息'
        })
        
        return members.value[index]
      }
      throw new Error('Member not found')
    } catch (err) {
      error.value = '更新成员失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const removeMember = async (memberId: string) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const index = members.value.findIndex(m => m.id === memberId)
      if (index > -1) {
        const member = members.value[index]
        members.value.splice(index, 1)
        teamStats.value.totalMembers = members.value.length
        
        // 添加活动记录
        activities.value.unshift({
          id: Date.now().toString(),
          type: 'member',
          actor: { id: '1', name: '当前用户', avatar: '' },
          action: '移除了成员',
          target: member.name,
          timestamp: new Date().toISOString(),
          details: `从团队中移除了${member.name}`
        })
        
        return true
      }
      throw new Error('Member not found')
    } catch (err) {
      error.value = '移除成员失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateTeamSettings = async (settings: any) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (currentTeam.value) {
        currentTeam.value = {
          ...currentTeam.value,
          ...settings.basic,
          settings: {
            ...currentTeam.value.settings,
            access: settings.access,
            notifications: settings.notifications
          },
          updatedAt: new Date().toISOString()
        }
        
        // 添加活动记录
        activities.value.unshift({
          id: Date.now().toString(),
          type: 'setting',
          actor: { id: '1', name: '当前用户', avatar: '' },
          action: '更新了团队设置',
          target: '团队配置',
          timestamp: new Date().toISOString(),
          details: '修改了团队的基本设置和权限配置'
        })
      }
    } catch (err) {
      error.value = '更新团队设置失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updatePermissionsMatrix = (newMatrix: any) => {
    permissionsMatrix.value = { ...permissionsMatrix.value, ...newMatrix }
    
    // 添加活动记录
    activities.value.unshift({
      id: Date.now().toString(),
      type: 'permission',
      actor: { id: '1', name: '当前用户', avatar: '' },
      action: '更新了权限矩阵',
      target: '权限配置',
      timestamp: new Date().toISOString(),
      details: '修改了团队的权限矩阵配置'
    })
  }
  
  const getMemberById = (id: string) => {
    return members.value.find(member => member.id === id)
  }
  
  const getMembersByRole = (role: string) => {
    return members.value.filter(member => member.role === role)
  }
  
  const searchMembers = (query: string) => {
    const searchTerm = query.toLowerCase()
    return members.value.filter(member => 
      member.name.toLowerCase().includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm) ||
      member.title?.toLowerCase().includes(searchTerm) ||
      member.department?.toLowerCase().includes(searchTerm)
    )
  }
  
  const exportTeamData = async () => {
    loading.value = true
    try {
      // 模拟导出数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const exportData = {
        team: currentTeam.value,
        members: members.value,
        activities: activities.value,
        stats: teamStats.value,
        exportedAt: new Date().toISOString()
      }
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `team-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return true
    } catch (err) {
      error.value = '导出数据失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const loadActivityLog = async () => {
    loading.value = true
    try {
      // 模拟加载活动日志
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 这里可以添加更多活动数据或从API获取
      return activities.value
    } catch (err) {
      error.value = '加载活动日志失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const generateInviteLink = async () => {
    loading.value = true
    try {
      // 模拟生成邀请链接
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const inviteCode = Math.random().toString(36).substring(2, 15)
      const inviteLink = `${window.location.origin}/invite/${inviteCode}`
      
      return inviteLink
    } catch (err) {
      error.value = '生成邀请链接失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const inviteMembers = async (inviteData: any) => {
    loading.value = true
    try {
      // 模拟邀请成员
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 添加活动记录
      activities.value.unshift({
        id: Date.now().toString(),
        type: 'member',
        actor: { id: '1', name: '当前用户', avatar: '' },
        action: '发送了邀请',
        target: inviteData.emails ? inviteData.emails.join(', ') : '新成员',
        timestamp: new Date().toISOString(),
        details: `邀请了${inviteData.emails?.length || 1}名新成员加入团队`
      })
      
      return true
    } catch (err) {
      error.value = '邀请成员失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const switchTeam = async (teamId: string) => {
    loading.value = true
    try {
      // 模拟切换团队
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 这里应该根据teamId加载对应的团队数据
      // 暂时使用当前团队数据
      console.log('Switching to team:', teamId)
      
      return true
    } catch (err) {
      error.value = '切换团队失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    // 状态
    currentTeam,
    members,
    loading,
    error,
    teamStats,
    activities,
    permissionsMatrix,
    
    // 计算属性
    membersByRole,
    activeMembers,
    recentActivities,
    
    // 方法
    fetchTeamData,
    addMember,
    updateMember,
    removeMember,
    updateTeamSettings,
    updatePermissionsMatrix,
    getMemberById,
    getMembersByRole,
    searchMembers,
    exportTeamData,
    loadActivityLog,
    generateInviteLink,
    inviteMembers,
    switchTeam
  }
})