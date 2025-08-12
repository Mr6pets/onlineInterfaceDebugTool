import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
// 临时本地类型定义
interface Environment {
  id: string
  name: string
  description?: string
  variables: EnvironmentVariable[]
  isActive: boolean
  groupId?: string
  createdAt: Date
  updatedAt: Date
}

interface EnvironmentVariable {
  key: string
  value: string
  description?: string
  isSecret?: boolean
  isEnabled?: boolean
}

interface EnvironmentGroup {
  id: string
  name: string
  description?: string
  color?: string
  environments: string[]
}

interface EnvironmentTemplate {
  id: string
  name: string
  description?: string
  variables: EnvironmentVariable[]
  tags?: string[]
}

interface EnvironmentConfig {
  defaultEnvironment?: string
  autoSwitchEnvironment?: boolean
  variablePrefix?: string
  variableSuffix?: string
}

interface ActivityLog {
  id: string
  action: string
  resource: string
  resourceId: string
  details: string
  timestamp: Date
}

// 临时本地存储工具
const storage = {
  async get(key: string) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  },
  async set(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage error:', error)
    }
  }
}
import { ElMessage } from 'element-plus'
import { useWorkspaceStore } from './workspace'

export const useEnvironmentStore = defineStore('environment', () => {
  const workspaceStore = useWorkspaceStore()
  
  // 状态
  const environments = ref<Environment[]>([])
  const environmentGroups = ref<EnvironmentGroup[]>([])
  const environmentTemplates = ref<EnvironmentTemplate[]>([])
  const currentEnvironment = ref<Environment | null>(null)
  const globalVariables = ref<EnvironmentVariable[]>([])
  
  // UI状态
  const loading = ref(false)
  const saving = ref(false)
  const importing = ref(false)
  const exporting = ref(false)
  
  // 搜索和过滤
  const searchQuery = ref('')
  const selectedGroups = ref<string[]>([])
  const showInactive = ref(false)
  
  // 计算属性
  const filteredEnvironments = computed(() => {
    let filtered = environments.value
    
    if (!showInactive.value) {
      filtered = filtered.filter(env => env.isActive)
    }
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(env => 
        env.name.toLowerCase().includes(query) ||
        env.description?.toLowerCase().includes(query) ||
        env.variables.some(variable => 
          variable.key.toLowerCase().includes(query) ||
          variable.value.toLowerCase().includes(query)
        )
      )
    }
    
    if (selectedGroups.value.length > 0) {
      filtered = filtered.filter(env => 
        env.groupId && selectedGroups.value.includes(env.groupId)
      )
    }
    
    return filtered
  })
  
  const activeEnvironments = computed(() => {
    return environments.value.filter(env => env.isActive)
  })
  
  const environmentsByGroup = computed(() => {
    const grouped: Record<string, Environment[]> = {}
    
    environments.value.forEach(env => {
      const groupId = env.groupId || 'ungrouped'
      if (!grouped[groupId]) {
        grouped[groupId] = []
      }
      grouped[groupId].push(env)
    })
    
    return grouped
  })
  
  const allVariableKeys = computed(() => {
    const keys = new Set<string>()
    
    // 全局变量
    globalVariables.value.forEach(variable => {
      keys.add(variable.key)
    })
    
    // 环境变量
    environments.value.forEach(env => {
      env.variables.forEach(variable => {
        keys.add(variable.key)
      })
    })
    
    return Array.from(keys).sort()
  })
  
  const variableConflicts = computed(() => {
    const conflicts: { key: string; environments: string[] }[] = []
    const variableMap: Record<string, string[]> = {}
    
    environments.value.forEach(env => {
      env.variables.forEach(variable => {
        if (!variableMap[variable.key]) {
          variableMap[variable.key] = []
        }
        variableMap[variable.key].push(env.name)
      })
    })
    
    Object.entries(variableMap).forEach(([key, envNames]) => {
      if (envNames.length > 1) {
        conflicts.push({ key, environments: envNames })
      }
    })
    
    return conflicts
  })
  
  // 数据加载
  const loadEnvironments = async () => {
    loading.value = true
    try {
      const savedEnvironments = await storage.get('environments') || []
      environments.value = savedEnvironments
      
      const savedGroups = await storage.get('environmentGroups') || []
      environmentGroups.value = savedGroups
      
      const savedTemplates = await storage.get('environmentTemplates') || []
      environmentTemplates.value = savedTemplates
      
      const savedGlobalVariables = await storage.get('globalVariables') || []
      globalVariables.value = savedGlobalVariables
      
      const savedCurrentEnv = await storage.get('currentEnvironment')
      if (savedCurrentEnv) {
        currentEnvironment.value = environments.value.find(env => env.id === savedCurrentEnv) || null
      }
    } catch (error) {
      console.error('Failed to load environments:', error)
      ElMessage.error('加载环境失败')
    } finally {
      loading.value = false
    }
  }
  
  const saveEnvironments = async () => {
    try {
      await storage.set('environments', environments.value)
    } catch (error) {
      console.error('Failed to save environments:', error)
      ElMessage.error('保存环境失败')
    }
  }
  
  const saveGroups = async () => {
    try {
      await storage.set('environmentGroups', environmentGroups.value)
    } catch (error) {
      console.error('Failed to save environment groups:', error)
    }
  }
  
  const saveTemplates = async () => {
    try {
      await storage.set('environmentTemplates', environmentTemplates.value)
    } catch (error) {
      console.error('Failed to save environment templates:', error)
    }
  }
  
  const saveGlobalVariables = async () => {
    try {
      await storage.set('globalVariables', globalVariables.value)
    } catch (error) {
      console.error('Failed to save global variables:', error)
    }
  }
  
  const saveCurrentEnvironment = async () => {
    try {
      await storage.set('currentEnvironment', currentEnvironment.value?.id || null)
    } catch (error) {
      console.error('Failed to save current environment:', error)
    }
  }
  
  // 环境管理
  const createEnvironment = async (environmentData: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>) => {
    saving.value = true
    try {
      const newEnvironment: Environment = {
        ...environmentData,
        id: `env-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      environments.value.push(newEnvironment)
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'create',
        resource: 'environment',
        resourceId: newEnvironment.id,
        details: `创建环境: ${newEnvironment.name}`
      })
      
      ElMessage.success('环境创建成功')
      return newEnvironment
    } catch (error) {
      console.error('Failed to create environment:', error)
      ElMessage.error('创建环境失败')
      throw error
    } finally {
      saving.value = false
    }
  }
  
  const updateEnvironment = async (environmentId: string, updates: Partial<Environment>) => {
    saving.value = true
    try {
      const environment = environments.value.find(env => env.id === environmentId)
      if (!environment) {
        throw new Error('Environment not found')
      }
      
      Object.assign(environment, updates, { updatedAt: new Date() })
      await saveEnvironments()
      
      // 如果更新的是当前环境，同步更新
      if (currentEnvironment.value?.id === environmentId) {
        currentEnvironment.value = environment
        await saveCurrentEnvironment()
      }
      
      await workspaceStore.logActivity({
        action: 'update',
        resource: 'environment',
        resourceId: environmentId,
        details: `更新环境: ${environment.name}`
      })
      
      ElMessage.success('环境更新成功')
    } catch (error) {
      console.error('Failed to update environment:', error)
      ElMessage.error('更新环境失败')
    } finally {
      saving.value = false
    }
  }
  
  const deleteEnvironment = async (environmentId: string) => {
    saving.value = true
    try {
      const environmentIndex = environments.value.findIndex(env => env.id === environmentId)
      if (environmentIndex === -1) return
      
      const environment = environments.value[environmentIndex]
      
      // 如果删除的是当前环境，清空当前环境
      if (currentEnvironment.value?.id === environmentId) {
        currentEnvironment.value = null
        await saveCurrentEnvironment()
      }
      
      environments.value.splice(environmentIndex, 1)
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'delete',
        resource: 'environment',
        resourceId: environmentId,
        details: `删除环境: ${environment.name}`
      })
      
      ElMessage.success('环境删除成功')
    } catch (error) {
      console.error('Failed to delete environment:', error)
      ElMessage.error('删除环境失败')
    } finally {
      saving.value = false
    }
  }
  
  const duplicateEnvironment = async (environmentId: string) => {
    saving.value = true
    try {
      const originalEnvironment = environments.value.find(env => env.id === environmentId)
      if (!originalEnvironment) {
        throw new Error('Environment not found')
      }
      
      const duplicatedEnvironment: Environment = {
        ...originalEnvironment,
        id: `env-${Date.now()}`,
        name: `${originalEnvironment.name} (副本)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        variables: originalEnvironment.variables.map(variable => ({ ...variable }))
      }
      
      environments.value.push(duplicatedEnvironment)
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'duplicate',
        resource: 'environment',
        resourceId: duplicatedEnvironment.id,
        details: `复制环境: ${originalEnvironment.name}`
      })
      
      ElMessage.success('环境复制成功')
      return duplicatedEnvironment
    } catch (error) {
      console.error('Failed to duplicate environment:', error)
      ElMessage.error('复制环境失败')
      throw error
    } finally {
      saving.value = false
    }
  }
  
  const switchEnvironment = async (environmentId: string | null) => {
    try {
      if (environmentId) {
        const environment = environments.value.find(env => env.id === environmentId)
        if (!environment) {
          throw new Error('Environment not found')
        }
        currentEnvironment.value = environment
      } else {
        currentEnvironment.value = null
      }
      
      await saveCurrentEnvironment()
      
      const envName = currentEnvironment.value?.name || '无环境'
      ElMessage.success(`已切换到环境: ${envName}`)
      
      await workspaceStore.logActivity({
        action: 'switch',
        resource: 'environment',
        resourceId: environmentId || '',
        details: `切换环境: ${envName}`
      })
    } catch (error) {
      console.error('Failed to switch environment:', error)
      ElMessage.error('切换环境失败')
    }
  }
  
  // 环境组管理
  const createEnvironmentGroup = async (groupData: Omit<EnvironmentGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    saving.value = true
    try {
      const newGroup: EnvironmentGroup = {
        ...groupData,
        id: `group-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      environmentGroups.value.push(newGroup)
      await saveGroups()
      
      await workspaceStore.logActivity({
        action: 'create',
        resource: 'environment_group',
        resourceId: newGroup.id,
        details: `创建环境组: ${newGroup.name}`
      })
      
      ElMessage.success('环境组创建成功')
      return newGroup
    } catch (error) {
      console.error('Failed to create environment group:', error)
      ElMessage.error('创建环境组失败')
      throw error
    } finally {
      saving.value = false
    }
  }
  
  const updateEnvironmentGroup = async (groupId: string, updates: Partial<EnvironmentGroup>) => {
    saving.value = true
    try {
      const group = environmentGroups.value.find(g => g.id === groupId)
      if (!group) {
        throw new Error('Environment group not found')
      }
      
      Object.assign(group, updates, { updatedAt: new Date() })
      await saveGroups()
      
      await workspaceStore.logActivity({
        action: 'update',
        resource: 'environment_group',
        resourceId: groupId,
        details: `更新环境组: ${group.name}`
      })
      
      ElMessage.success('环境组更新成功')
    } catch (error) {
      console.error('Failed to update environment group:', error)
      ElMessage.error('更新环境组失败')
    } finally {
      saving.value = false
    }
  }
  
  const deleteEnvironmentGroup = async (groupId: string) => {
    saving.value = true
    try {
      const groupIndex = environmentGroups.value.findIndex(g => g.id === groupId)
      if (groupIndex === -1) return
      
      const group = environmentGroups.value[groupIndex]
      
      // 将该组下的环境移到未分组
      environments.value.forEach(env => {
        if (env.groupId === groupId) {
          env.groupId = undefined
        }
      })
      
      environmentGroups.value.splice(groupIndex, 1)
      await saveGroups()
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'delete',
        resource: 'environment_group',
        resourceId: groupId,
        details: `删除环境组: ${group.name}`
      })
      
      ElMessage.success('环境组删除成功')
    } catch (error) {
      console.error('Failed to delete environment group:', error)
      ElMessage.error('删除环境组失败')
    } finally {
      saving.value = false
    }
  }
  
  // 变量管理
  const addVariable = async (environmentId: string, variable: Omit<EnvironmentVariable, 'id'>) => {
    try {
      const environment = environments.value.find(env => env.id === environmentId)
      if (!environment) {
        throw new Error('Environment not found')
      }
      
      const newVariable: EnvironmentVariable = {
        ...variable,
        id: `var-${Date.now()}`
      }
      
      environment.variables.push(newVariable)
      environment.updatedAt = new Date()
      
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'add_variable',
        resource: 'environment',
        resourceId: environmentId,
        details: `添加变量: ${variable.key}`
      })
      
      ElMessage.success('变量添加成功')
      return newVariable
    } catch (error) {
      console.error('Failed to add variable:', error)
      ElMessage.error('添加变量失败')
      throw error
    }
  }
  
  const updateVariable = async (environmentId: string, variableId: string, updates: Partial<EnvironmentVariable>) => {
    try {
      const environment = environments.value.find(env => env.id === environmentId)
      if (!environment) {
        throw new Error('Environment not found')
      }
      
      const variable = environment.variables.find(v => v.id === variableId)
      if (!variable) {
        throw new Error('Variable not found')
      }
      
      Object.assign(variable, updates)
      environment.updatedAt = new Date()
      
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'update_variable',
        resource: 'environment',
        resourceId: environmentId,
        details: `更新变量: ${variable.key}`
      })
      
      ElMessage.success('变量更新成功')
    } catch (error) {
      console.error('Failed to update variable:', error)
      ElMessage.error('更新变量失败')
    }
  }
  
  const deleteVariable = async (environmentId: string, variableId: string) => {
    try {
      const environment = environments.value.find(env => env.id === environmentId)
      if (!environment) return
      
      const variableIndex = environment.variables.findIndex(v => v.id === variableId)
      if (variableIndex === -1) return
      
      const variable = environment.variables[variableIndex]
      environment.variables.splice(variableIndex, 1)
      environment.updatedAt = new Date()
      
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'delete_variable',
        resource: 'environment',
        resourceId: environmentId,
        details: `删除变量: ${variable.key}`
      })
      
      ElMessage.success('变量删除成功')
    } catch (error) {
      console.error('Failed to delete variable:', error)
      ElMessage.error('删除变量失败')
    }
  }
  
  // 全局变量管理
  const addGlobalVariable = async (variable: Omit<EnvironmentVariable, 'id'>) => {
    try {
      const newVariable: EnvironmentVariable = {
        ...variable,
        id: `global-var-${Date.now()}`
      }
      
      globalVariables.value.push(newVariable)
      await saveGlobalVariables()
      
      await workspaceStore.logActivity({
        action: 'add_global_variable',
        resource: 'global_variables',
        resourceId: newVariable.id,
        details: `添加全局变量: ${variable.key}`
      })
      
      ElMessage.success('全局变量添加成功')
      return newVariable
    } catch (error) {
      console.error('Failed to add global variable:', error)
      ElMessage.error('添加全局变量失败')
      throw error
    }
  }
  
  const updateGlobalVariable = async (variableId: string, updates: Partial<EnvironmentVariable>) => {
    try {
      const variable = globalVariables.value.find(v => v.id === variableId)
      if (!variable) {
        throw new Error('Global variable not found')
      }
      
      Object.assign(variable, updates)
      await saveGlobalVariables()
      
      await workspaceStore.logActivity({
        action: 'update_global_variable',
        resource: 'global_variables',
        resourceId: variableId,
        details: `更新全局变量: ${variable.key}`
      })
      
      ElMessage.success('全局变量更新成功')
    } catch (error) {
      console.error('Failed to update global variable:', error)
      ElMessage.error('更新全局变量失败')
    }
  }
  
  const deleteGlobalVariable = async (variableId: string) => {
    try {
      const variableIndex = globalVariables.value.findIndex(v => v.id === variableId)
      if (variableIndex === -1) return
      
      const variable = globalVariables.value[variableIndex]
      globalVariables.value.splice(variableIndex, 1)
      await saveGlobalVariables()
      
      await workspaceStore.logActivity({
        action: 'delete_global_variable',
        resource: 'global_variables',
        resourceId: variableId,
        details: `删除全局变量: ${variable.key}`
      })
      
      ElMessage.success('全局变量删除成功')
    } catch (error) {
      console.error('Failed to delete global variable:', error)
      ElMessage.error('删除全局变量失败')
    }
  }
  
  // 模板管理
  const createTemplate = async (templateData: Omit<EnvironmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    saving.value = true
    try {
      const newTemplate: EnvironmentTemplate = {
        ...templateData,
        id: `template-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      environmentTemplates.value.push(newTemplate)
      await saveTemplates()
      
      await workspaceStore.logActivity({
        action: 'create',
        resource: 'environment_template',
        resourceId: newTemplate.id,
        details: `创建环境模板: ${newTemplate.name}`
      })
      
      ElMessage.success('环境模板创建成功')
      return newTemplate
    } catch (error) {
      console.error('Failed to create environment template:', error)
      ElMessage.error('创建环境模板失败')
      throw error
    } finally {
      saving.value = false
    }
  }
  
  const applyTemplate = async (templateId: string, environmentName: string) => {
    saving.value = true
    try {
      const template = environmentTemplates.value.find(t => t.id === templateId)
      if (!template) {
        throw new Error('Template not found')
      }
      
      const newEnvironment: Environment = {
        id: `env-${Date.now()}`,
        name: environmentName,
        description: template.description,
        variables: template.variables.map(variable => ({ ...variable, id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` })),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      environments.value.push(newEnvironment)
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'apply_template',
        resource: 'environment',
        resourceId: newEnvironment.id,
        details: `应用模板创建环境: ${environmentName}`
      })
      
      ElMessage.success('环境模板应用成功')
      return newEnvironment
    } catch (error) {
      console.error('Failed to apply template:', error)
      ElMessage.error('应用环境模板失败')
      throw error
    } finally {
      saving.value = false
    }
  }
  
  // 数据导入导出
  const importEnvironments = async (data: any, format: 'json' | 'env' | 'postman') => {
    importing.value = true
    try {
      let importedEnvironments: Environment[] = []
      
      switch (format) {
        case 'json':
          importedEnvironments = await importFromJSON(data)
          break
        case 'env':
          importedEnvironments = await importFromEnvFile(data)
          break
        case 'postman':
          importedEnvironments = await importFromPostmanEnvironment(data)
          break
        default:
          throw new Error('Unsupported format')
      }
      
      environments.value.push(...importedEnvironments)
      await saveEnvironments()
      
      await workspaceStore.logActivity({
        action: 'import',
        resource: 'environment',
        resourceId: '',
        details: `导入 ${importedEnvironments.length} 个环境 (${format})`
      })
      
      ElMessage.success(`成功导入 ${importedEnvironments.length} 个环境`)
      return importedEnvironments
    } catch (error) {
      console.error('Failed to import environments:', error)
      ElMessage.error('导入环境失败')
      throw error
    } finally {
      importing.value = false
    }
  }
  
  const exportEnvironments = async (environmentIds: string[], format: 'json' | 'env' | 'postman') => {
    exporting.value = true
    try {
      const environmentsToExport = environments.value.filter(env => environmentIds.includes(env.id))
      
      let exportData: any
      
      switch (format) {
        case 'json':
          exportData = await exportToJSON(environmentsToExport)
          break
        case 'env':
          exportData = await exportToEnvFile(environmentsToExport)
          break
        case 'postman':
          exportData = await exportToPostmanEnvironment(environmentsToExport)
          break
        default:
          throw new Error('Unsupported format')
      }
      
      await workspaceStore.logActivity({
        action: 'export',
        resource: 'environment',
        resourceId: '',
        details: `导出 ${environmentsToExport.length} 个环境 (${format})`
      })
      
      ElMessage.success(`成功导出 ${environmentsToExport.length} 个环境`)
      return exportData
    } catch (error) {
      console.error('Failed to export environments:', error)
      ElMessage.error('导出环境失败')
      throw error
    } finally {
      exporting.value = false
    }
  }
  
  // 辅助函数（简化实现）
  const importFromJSON = async (data: any): Promise<Environment[]> => {
    if (Array.isArray(data)) {
      return data.map(env => ({
        ...env,
        id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    }
    return []
  }
  
  const importFromEnvFile = async (data: string): Promise<Environment[]> => {
    const variables: EnvironmentVariable[] = []
    const lines = data.split('\n')
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          variables.push({
            id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            key: key.trim(),
            value: valueParts.join('=').trim(),
            type: 'text',
            isEnabled: true
          })
        }
      }
    })
    
    return [{
      id: `env-${Date.now()}`,
      name: '导入的环境',
      description: '从 .env 文件导入',
      variables,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  }
  
  const importFromPostmanEnvironment = async (data: any): Promise<Environment[]> => {
    const variables: EnvironmentVariable[] = []
    
    if (data.values && Array.isArray(data.values)) {
      data.values.forEach((item: any) => {
        if (item.key) {
          variables.push({
            id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            key: item.key,
            value: item.value || '',
            type: item.type || 'text',
            isEnabled: item.enabled !== false
          })
        }
      })
    }
    
    return [{
      id: `env-${Date.now()}`,
      name: data.name || '导入的环境',
      description: '从 Postman 环境导入',
      variables,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  }
  
  const exportToJSON = async (environments: Environment[]) => {
    return environments
  }
  
  const exportToEnvFile = async (environments: Environment[]) => {
    if (environments.length === 0) return ''
    
    const env = environments[0] // 只导出第一个环境
    const lines: string[] = []
    
    lines.push(`# ${env.name}`)
    if (env.description) {
      lines.push(`# ${env.description}`)
    }
    lines.push('')
    
    env.variables.forEach(variable => {
      if (variable.isEnabled) {
        lines.push(`${variable.key}=${variable.value}`)
      }
    })
    
    return lines.join('\n')
  }
  
  const exportToPostmanEnvironment = async (environments: Environment[]) => {
    if (environments.length === 0) return null
    
    const env = environments[0] // 只导出第一个环境
    
    return {
      id: env.id,
      name: env.name,
      values: env.variables.map(variable => ({
        key: variable.key,
        value: variable.value,
        type: variable.type,
        enabled: variable.isEnabled
      }))
    }
  }
  
  // 变量解析
  const resolveVariables = (text: string, environment?: Environment): string => {
    let resolved = text
    
    // 解析全局变量
    globalVariables.value.forEach(variable => {
      if (variable.isEnabled) {
        const regex = new RegExp(`{{${variable.key}}}`, 'g')
        resolved = resolved.replace(regex, variable.value)
      }
    })
    
    // 解析环境变量
    const env = environment || currentEnvironment.value
    if (env) {
      env.variables.forEach(variable => {
        if (variable.isEnabled) {
          const regex = new RegExp(`{{${variable.key}}}`, 'g')
          resolved = resolved.replace(regex, variable.value)
        }
      })
    }
    
    return resolved
  }
  
  const getVariableValue = (key: string, environment?: Environment): string | undefined => {
    // 优先从指定环境或当前环境获取
    const env = environment || currentEnvironment.value
    if (env) {
      const envVariable = env.variables.find(v => v.key === key && v.isEnabled)
      if (envVariable) {
        return envVariable.value
      }
    }
    
    // 从全局变量获取
    const globalVariable = globalVariables.value.find(v => v.key === key && v.isEnabled)
    return globalVariable?.value
  }
  
  // 监听数据变化
  watch(environments, () => {
    saveEnvironments()
  }, { deep: true })
  
  watch(environmentGroups, () => {
    saveGroups()
  }, { deep: true })
  
  watch(environmentTemplates, () => {
    saveTemplates()
  }, { deep: true })
  
  watch(globalVariables, () => {
    saveGlobalVariables()
  }, { deep: true })
  
  watch(currentEnvironment, () => {
    saveCurrentEnvironment()
  })
  
  return {
    // 状态
    environments,
    environmentGroups,
    environmentTemplates,
    currentEnvironment,
    globalVariables,
    loading,
    saving,
    importing,
    exporting,
    searchQuery,
    selectedGroups,
    showInactive,
    
    // 计算属性
    filteredEnvironments,
    activeEnvironments,
    environmentsByGroup,
    allVariableKeys,
    variableConflicts,
    
    // 方法
    loadEnvironments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    duplicateEnvironment,
    switchEnvironment,
    createEnvironmentGroup,
    updateEnvironmentGroup,
    deleteEnvironmentGroup,
    addVariable,
    updateVariable,
    deleteVariable,
    addGlobalVariable,
    updateGlobalVariable,
    deleteGlobalVariable,
    createTemplate,
    applyTemplate,
    importEnvironments,
    exportEnvironments,
    resolveVariables,
    getVariableValue
  }
})