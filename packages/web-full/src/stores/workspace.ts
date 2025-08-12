import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
// 临时类型定义，避免导入问题
interface Workspace {
  id: string
  name: string
  description?: string
  collections: string[]
  environments: string[]
  settings: WorkspaceSettings
  createdAt: Date
  updatedAt: Date
}

interface WorkspaceSettings {
  timeout: number
  followRedirects: boolean
  validateSSL: boolean
  maxRedirects: number
  requestDelay: number
}

interface Environment {
  id: string
  name: string
  variables: Record<string, string>
  isActive: boolean
  baseUrl?: string
  createdAt: Date
  updatedAt: Date
}

interface ApiCollection {
  id: string
  name: string
  description?: string
  folders: any[]
  requests: any[]
  variables?: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

interface BatchTest {
  id: string
  name: string
  requests: any[]
  createdAt: Date
  updatedAt: Date
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Team {
  id: string
  name: string
}

interface TeamMember {
  id: string
  name: string
}

interface ShareLink {
  id: string
  resourceType: 'collection' | 'environment'
  resourceId: string
  permission: 'read' | 'write'
  token: string
  createdBy: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  accessCount: number
}

interface ActivityLog {
  id: string
  userId: string
  timestamp: Date
  action: string
  resource: string
  resourceId: string
  details: string
}

interface DataSync {
  status: string
}

interface Permission {
  userId: string
  action: string
  resource: string
}

interface ImportData {
  type: 'postman' | 'openapi' | 'insomnia'
  data: any
}

interface ExportData {
  workspace?: Workspace
  collections: ApiCollection[]
  environments: Environment[]
  version: string
  exportedAt: Date
}

// 简单的存储工具
const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  }
}
import { ElMessage } from 'element-plus'

export const useWorkspaceStore = defineStore('workspace', () => {
  // 基础状态
  const currentWorkspace = ref<Workspace | null>(null)
  const workspaces = ref<Workspace[]>([])
  const collections = ref<ApiCollection[]>([])
  const environments = ref<Environment[]>([])
  const batchTests = ref<BatchTest[]>([])
  
  // 企业级功能状态
  const currentUser = ref<User | null>(null)
  const currentTeam = ref<Team | null>(null)
  const teamMembers = ref<TeamMember[]>([])
  const shareLinks = ref<ShareLink[]>([])
  const activityLogs = ref<ActivityLog[]>([])
  const syncStatus = ref<DataSync | null>(null)
  const permissions = ref<Permission[]>([])
  
  // UI状态
  const loading = ref(false)
  const syncing = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  
  // 计算属性
  const hasPermission = computed(() => (action: string, resource: string) => {
    if (!currentUser.value) return false
    if (currentUser.value.role === 'owner' || currentUser.value.role === 'admin') return true
    
    return permissions.value.some(p => 
      p.userId === currentUser.value?.id && 
      p.action === action && 
      p.resource === resource
    )
  })
  
  const canManageWorkspace = computed(() => 
    hasPermission.value('manage', 'workspace')
  )
  
  const canManageTeam = computed(() => 
    hasPermission.value('manage', 'team')
  )
  
  const canCreateCollection = computed(() => 
    hasPermission.value('create', 'collection')
  )
  
  const isWorkspaceOwner = computed(() => 
    currentUser.value?.role === 'owner'
  )
  
  const activeEnvironment = computed(() => 
    environments.value.find(env => env.isActive)
  )
  
  const recentActivity = computed(() => 
    activityLogs.value.slice(0, 10).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  )
  
  // 基础数据加载
  const loadWorkspace = async () => {
    loading.value = true
    try {
      const workspace = await storage.get('currentWorkspace')
      if (workspace) {
        currentWorkspace.value = workspace
        await Promise.all([
          loadCollections(),
          loadEnvironments(),
          loadBatchTests(),
          loadTeamData(),
          loadActivityLogs()
        ])
      } else {
        // 创建默认工作空间
        const defaultWorkspace: Workspace = {
          id: 'default',
          name: '默认工作空间',
          description: '默认工作空间',
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
        currentWorkspace.value = defaultWorkspace
        await storage.set('currentWorkspace', defaultWorkspace)
        
        // 创建默认环境
        const defaultEnv: Environment = {
          id: 'default',
          name: '默认环境',
          variables: {},
          isActive: true,
          baseUrl: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        environments.value = [defaultEnv]
        await saveEnvironments()
      }
    } catch (error) {
      console.error('Failed to load workspace:', error)
      ElMessage.error('加载工作空间失败')
    } finally {
      loading.value = false
    }
  }
  
  const loadWorkspaces = async () => {
    try {
      const savedWorkspaces = await storage.get('workspaces') || []
      workspaces.value = savedWorkspaces
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    }
  }
  
  const loadCollections = async () => {
    try {
      const savedCollections = await storage.get('collections') || []
      collections.value = savedCollections
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }
  
  const loadEnvironments = async () => {
    try {
      const savedEnvironments = await storage.get('environments') || []
      environments.value = savedEnvironments
    } catch (error) {
      console.error('Failed to load environments:', error)
    }
  }
  
  const loadBatchTests = async () => {
    try {
      const savedBatchTests = await storage.get('batchTests') || []
      batchTests.value = savedBatchTests
    } catch (error) {
      console.error('Failed to load batch tests:', error)
    }
  }
  
  const loadTeamData = async () => {
    try {
      const [team, members, user] = await Promise.all([
        storage.get('currentTeam'),
        storage.get('teamMembers'),
        storage.get('currentUser')
      ])
      
      currentTeam.value = team
      teamMembers.value = members || []
      currentUser.value = user
    } catch (error) {
      console.error('Failed to load team data:', error)
    }
  }
  
  const loadActivityLogs = async () => {
    try {
      const logs = await storage.get('activityLogs') || []
      activityLogs.value = logs
    } catch (error) {
      console.error('Failed to load activity logs:', error)
    }
  }
  
  // 保存工作空间
  const saveWorkspace = () => {
    if (currentWorkspace.value) {
      currentWorkspace.value.updatedAt = new Date()
      storage.set('current_workspace', currentWorkspace.value)
    }
  }
  
  // 环境管理
  const saveEnvironment = (environment: Environment) => {
    const index = environments.value.findIndex(env => env.id === environment.id)
    
    if (index > -1) {
      environments.value[index] = environment
    } else {
      environments.value.push(environment)
    }
    
    // 如果设置为激活，取消其他环境的激活状态
    if (environment.isActive) {
      environments.value.forEach(env => {
        if (env.id !== environment.id) {
          env.isActive = false
        }
      })
    }
    
    saveEnvironments()
  }
  
  const deleteEnvironment = (environmentId: string) => {
    const index = environments.value.findIndex(env => env.id === environmentId)
    if (index > -1) {
      environments.value.splice(index, 1)
      saveEnvironments()
    }
  }
  
  const saveEnvironments = () => {
    storage.set('environments', environments.value)
  }
  
  // 集合管理
  const saveCollection = (collection: ApiCollection) => {
    const index = collections.value.findIndex(col => col.id === collection.id)
    
    if (index > -1) {
      collections.value[index] = collection
    } else {
      collections.value.push(collection)
    }
    
    saveCollections()
  }
  
  const deleteCollection = (collectionId: string) => {
    const index = collections.value.findIndex(col => col.id === collectionId)
    if (index > -1) {
      collections.value.splice(index, 1)
      saveCollections()
    }
  }
  
  const saveCollections = () => {
    storage.set('collections', collections.value)
  }
  
  // 批量测试管理
  const saveBatchTest = (batchTest: BatchTest) => {
    const index = batchTests.value.findIndex(test => test.id === batchTest.id)
    
    if (index > -1) {
      batchTests.value[index] = batchTest
    } else {
      batchTests.value.push(batchTest)
    }
    
    storage.set('batch_tests', batchTests.value)
  }
  
  const deleteBatchTest = (testId: string) => {
    const index = batchTests.value.findIndex(test => test.id === testId)
    if (index > -1) {
      batchTests.value.splice(index, 1)
      storage.set('batch_tests', batchTests.value)
    }
  }
  
  // 导入导出
  const importData = (importData: ImportData) => {
    // 根据不同类型处理导入数据
    switch (importData.type) {
      case 'postman':
        importPostmanData(importData.data)
        break
      case 'openapi':
        importOpenApiData(importData.data)
        break
      // 其他导入类型...
    }
  }
  
  const exportWorkspace = (): ExportData => {
    const exportData: ExportData = {
      workspace: currentWorkspace.value || undefined,
      collections: collections.value,
      environments: environments.value,
      version: '1.0.0',
      exportedAt: new Date()
    }
    
    // 下载JSON文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workspace_${currentWorkspace.value?.name || 'export'}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    return exportData
  }
  
  // Postman导入处理
  const importPostmanData = (postmanData: any) => {
    // 解析Postman集合格式
    if (postmanData.info && postmanData.item) {
      const collection: ApiCollection = {
        id: Date.now().toString(),
        name: postmanData.info.name || '导入的集合',
        description: postmanData.info.description || '',
        folders: [],
        requests: [],
        variables: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // 递归处理items
      const processItems = (items: any[], folderId?: string) => {
        items.forEach(item => {
          if (item.item) {
            // 这是一个文件夹
            const folder = {
              id: Date.now().toString() + Math.random(),
              name: item.name,
              description: item.description || '',
              parentId: folderId,
              requests: [],
              folders: []
            }
            collection.folders.push(folder)
            processItems(item.item, folder.id)
          } else if (item.request) {
            // 这是一个请求
            const request = {
              id: Date.now().toString() + Math.random(),
              name: item.name,
              description: item.description || '',
              folderId,
              request: {
                url: typeof item.request.url === 'string' ? item.request.url : item.request.url.raw,
                method: item.request.method,
                headers: item.request.header ? 
                  Object.fromEntries(item.request.header.map((h: any) => [h.key, h.value])) : {},
                data: item.request.body ? item.request.body.raw : undefined
              },
              examples: []
            }
            collection.requests.push(request)
          }
        })
      }
      
      processItems(postmanData.item)
      saveCollection(collection)
    }
  }
  
  // OpenAPI导入处理
  const importOpenApiData = (openApiData: any) => {
    // 解析OpenAPI格式
    const collection: ApiCollection = {
      id: Date.now().toString(),
      name: openApiData.info?.title || '导入的API',
      description: openApiData.info?.description || '',
      folders: [],
      requests: [],
      variables: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 处理paths
    if (openApiData.paths) {
      Object.entries(openApiData.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, operation]: [string, any]) => {
          const request = {
            id: Date.now().toString() + Math.random(),
            name: operation.summary || `${method.toUpperCase()} ${path}`,
            description: operation.description || '',
            request: {
              url: (openApiData.servers?.[0]?.url || '') + path,
              method: method.toUpperCase() as any,
              headers: {},
              params: {}
            },
            examples: []
          }
          collection.requests.push(request)
        })
      })
    }
    
    saveCollection(collection)
  }
  
  // 企业级功能方法
    const createWorkspace = async (workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newWorkspace: Workspace = {
          ...workspace,
          id: `workspace-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        workspaces.value.push(newWorkspace)
        await storage.set('workspaces', workspaces.value)
        
        await logActivity({
          action: 'create',
          resource: 'workspace',
          resourceId: newWorkspace.id,
          details: `创建工作空间: ${newWorkspace.name}`
        })
        
        ElMessage.success('工作空间创建成功')
        return newWorkspace
      } catch (error) {
        console.error('Failed to create workspace:', error)
        ElMessage.error('创建工作空间失败')
        throw error
      }
    }
    
    const switchWorkspace = async (workspaceId: string) => {
      try {
        const workspace = workspaces.value.find(w => w.id === workspaceId)
        if (!workspace) {
          throw new Error('Workspace not found')
        }
        
        currentWorkspace.value = workspace
        await storage.set('currentWorkspace', workspace)
        
        // 重新加载相关数据
        await Promise.all([
          loadCollections(),
          loadEnvironments(),
          loadBatchTests()
        ])
        
        await logActivity({
          action: 'switch',
          resource: 'workspace',
          resourceId: workspaceId,
          details: `切换到工作空间: ${workspace.name}`
        })
        
        ElMessage.success(`已切换到工作空间: ${workspace.name}`)
      } catch (error) {
        console.error('Failed to switch workspace:', error)
        ElMessage.error('切换工作空间失败')
      }
    }
    
    const updateWorkspaceSettings = async (settings: Partial<WorkspaceSettings>) => {
      if (!currentWorkspace.value) return
      
      try {
        currentWorkspace.value.settings = {
          ...currentWorkspace.value.settings,
          ...settings
        }
        currentWorkspace.value.updatedAt = new Date()
        
        await saveWorkspace()
        
        await logActivity({
          action: 'update',
          resource: 'workspace_settings',
          resourceId: currentWorkspace.value.id,
          details: '更新工作空间设置'
        })
        
        ElMessage.success('设置已保存')
      } catch (error) {
        console.error('Failed to update workspace settings:', error)
        ElMessage.error('保存设置失败')
      }
    }
    
    const inviteTeamMember = async (email: string, role: 'admin' | 'member' | 'viewer') => {
      try {
        const invitation: TeamMember = {
          id: `member-${Date.now()}`,
          userId: `user-${Date.now()}`,
          teamId: currentTeam.value?.id || '',
          role,
          status: 'pending',
          invitedBy: currentUser.value?.id || '',
          invitedAt: new Date(),
          joinedAt: null
        }
        
        teamMembers.value.push(invitation)
        await storage.set('teamMembers', teamMembers.value)
        
        await logActivity({
          action: 'invite',
          resource: 'team_member',
          resourceId: invitation.id,
          details: `邀请团队成员: ${email}`
        })
        
        ElMessage.success('邀请已发送')
        return invitation
      } catch (error) {
        console.error('Failed to invite team member:', error)
        ElMessage.error('发送邀请失败')
        throw error
      }
    }
    
    const removeTeamMember = async (memberId: string) => {
      try {
        const memberIndex = teamMembers.value.findIndex(m => m.id === memberId)
        if (memberIndex === -1) return
        
        const member = teamMembers.value[memberIndex]
        teamMembers.value.splice(memberIndex, 1)
        await storage.set('teamMembers', teamMembers.value)
        
        await logActivity({
          action: 'remove',
          resource: 'team_member',
          resourceId: memberId,
          details: `移除团队成员: ${member.userId}`
        })
        
        ElMessage.success('成员已移除')
      } catch (error) {
        console.error('Failed to remove team member:', error)
        ElMessage.error('移除成员失败')
      }
    }
    
    const createShareLink = async (resourceType: 'collection' | 'environment', resourceId: string, permission: 'read' | 'write') => {
      try {
        const shareLink: ShareLink = {
          id: `share-${Date.now()}`,
          resourceType,
          resourceId,
          permission,
          token: `token-${Math.random().toString(36).substr(2, 9)}`,
          createdBy: currentUser.value?.id || '',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
          isActive: true,
          accessCount: 0
        }
        
        shareLinks.value.push(shareLink)
        await storage.set('shareLinks', shareLinks.value)
        
        await logActivity({
          action: 'create',
          resource: 'share_link',
          resourceId: shareLink.id,
          details: `创建分享链接: ${resourceType}/${resourceId}`
        })
        
        ElMessage.success('分享链接已创建')
        return shareLink
      } catch (error) {
        console.error('Failed to create share link:', error)
        ElMessage.error('创建分享链接失败')
        throw error
      }
    }
    
    const revokeShareLink = async (linkId: string) => {
      try {
        const link = shareLinks.value.find(l => l.id === linkId)
        if (link) {
          link.isActive = false
          await storage.set('shareLinks', shareLinks.value)
          
          await logActivity({
            action: 'revoke',
            resource: 'share_link',
            resourceId: linkId,
            details: '撤销分享链接'
          })
          
          ElMessage.success('分享链接已撤销')
        }
      } catch (error) {
        console.error('Failed to revoke share link:', error)
        ElMessage.error('撤销分享链接失败')
      }
    }
    
    const syncData = async () => {
      if (syncing.value) return
      
      syncing.value = true
      try {
        // 模拟数据同步
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        lastSyncTime.value = new Date()
        await storage.set('lastSyncTime', lastSyncTime.value)
        
        await logActivity({
          action: 'sync',
          resource: 'workspace',
          resourceId: currentWorkspace.value?.id || '',
          details: '数据同步完成'
        })
        
        ElMessage.success('数据同步成功')
      } catch (error) {
        console.error('Failed to sync data:', error)
        ElMessage.error('数据同步失败')
      } finally {
        syncing.value = false
      }
    }
    
    const logActivity = async (activity: Omit<ActivityLog, 'id' | 'timestamp' | 'userId'>) => {
      try {
        const log: ActivityLog = {
          ...activity,
          id: `log-${Date.now()}`,
          userId: currentUser.value?.id || '',
          timestamp: new Date()
        }
        
        activityLogs.value.unshift(log)
        
        // 只保留最近1000条记录
        if (activityLogs.value.length > 1000) {
          activityLogs.value = activityLogs.value.slice(0, 1000)
        }
        
        await storage.set('activityLogs', activityLogs.value)
      } catch (error) {
        console.error('Failed to log activity:', error)
      }
    }
    
    const activateEnvironment = async (environmentId: string) => {
      try {
        const environment = environments.value.find(env => env.id === environmentId)
        if (!environment) {
          ElMessage.error('环境不存在')
          return
        }
        
        // 将所有环境设为非激活状态
        environments.value.forEach(env => {
          env.isActive = false
        })
        
        // 激活指定环境
        environment.isActive = true
        
        await storage.set('environments', environments.value)
        
        await logActivity({
          action: 'activate',
          resource: 'environment',
          resourceId: environmentId,
          details: `激活环境: ${environment.name}`
        })
        
        ElMessage.success(`已激活环境: ${environment.name}`)
      } catch (error) {
        console.error('Failed to activate environment:', error)
        ElMessage.error('激活环境失败')
      }
    }
    
    const saveBatchTests = () => {
      storage.set('batchTests', batchTests.value)
    }
    
    // 监听数据变化，自动保存
    watch(currentWorkspace, (newWorkspace) => {
      if (newWorkspace) {
        storage.set('currentWorkspace', newWorkspace)
      }
    }, { deep: true })
    
    watch(collections, () => {
      saveCollections()
    }, { deep: true })
    
    watch(environments, () => {
      saveEnvironments()
    }, { deep: true })
    
    watch(batchTests, () => {
      saveBatchTests()
    }, { deep: true })
    
    return {
      // 状态
      currentWorkspace,
      workspaces,
      collections,
      environments,
      batchTests,
      currentUser,
      currentTeam,
      teamMembers,
      shareLinks,
      activityLogs,
      syncStatus,
      permissions,
      loading,
      syncing,
      lastSyncTime,
      
      // 计算属性
      hasPermission,
      canManageWorkspace,
      canManageTeam,
      canCreateCollection,
      isWorkspaceOwner,
      activeEnvironment,
      recentActivity,
      
      // 基础方法
      loadWorkspace,
      loadWorkspaces,
      saveWorkspace,
      saveEnvironment,
      deleteEnvironment,
      activateEnvironment,
      saveCollection,
      deleteCollection,
      saveBatchTest,
      deleteBatchTest,
      importData,
      exportWorkspace,
      
      // 企业级功能方法
      createWorkspace,
      switchWorkspace,
      updateWorkspaceSettings,
      inviteTeamMember,
      removeTeamMember,
      createShareLink,
      revokeShareLink,
      syncData,
      logActivity
    }
  })