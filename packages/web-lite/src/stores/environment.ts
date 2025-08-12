import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Environment, StoredEnvironments } from '@/types'
import { STORAGE_KEYS } from '@/types'

export const useEnvironmentStore = defineStore('environment', () => {
  const environments = ref<Environment[]>([])
  const currentEnvironmentId = ref<string | null>(null)
  
  // 计算属性：当前环境
  const currentEnvironment = computed(() => {
    if (!currentEnvironmentId.value) return null
    return environments.value.find(env => env.id === currentEnvironmentId.value) || null
  })
  
  // 计算属性：全局变量（所有环境变量的合并）
  const globalVariables = computed(() => {
    const variables: Record<string, string> = {}
    environments.value.forEach(env => {
      Object.assign(variables, env.variables)
    })
    return variables
  })
  
  // 计算属性：当前有效变量（当前环境变量优先）
  const activeVariables = computed(() => {
    const variables: Record<string, string> = {}
    
    // 先添加全局变量
    environments.value.forEach(env => {
      if (env.id !== currentEnvironmentId.value) {
        Object.assign(variables, env.variables)
      }
    })
    
    // 当前环境变量覆盖全局变量
    if (currentEnvironment.value) {
      Object.assign(variables, currentEnvironment.value.variables)
    }
    
    return variables
  })
  
  // 创建环境
  const createEnvironment = (env: Omit<Environment, 'id'>) => {
    const newEnv: Environment = {
      ...env,
      id: Date.now().toString(),
      variables: env.variables || {}
    }
    
    environments.value.push(newEnv)
    
    // 如果是第一个环境，自动设为当前环境
    if (environments.value.length === 1) {
      switchEnvironment(newEnv.id)
    }
    
    saveToStorage()
    return newEnv
  }
  
  // 更新环境
  const updateEnvironment = (id: string, updates: Partial<Environment>) => {
    const index = environments.value.findIndex(env => env.id === id)
    if (index !== -1) {
      environments.value[index] = {
        ...environments.value[index],
        ...updates,
        id // 确保ID不被覆盖
      }
      saveToStorage()
      return environments.value[index]
    }
    return null
  }
  
  // 删除环境
  const deleteEnvironment = (id: string) => {
    const index = environments.value.findIndex(env => env.id === id)
    if (index !== -1) {
      environments.value.splice(index, 1)
      
      // 如果删除的是当前环境，切换到第一个可用环境
      if (currentEnvironmentId.value === id) {
        if (environments.value.length > 0) {
          switchEnvironment(environments.value[0].id)
        } else {
          currentEnvironmentId.value = null
        }
      }
      
      saveToStorage()
      return true
    }
    return false
  }
  
  // 切换环境
  const switchEnvironment = (id: string | null) => {
    if (id === null || environments.value.find(env => env.id === id)) {
      currentEnvironmentId.value = id
      saveCurrentEnvironment()
    }
  }
  
  // 复制环境
  const duplicateEnvironment = (id: string) => {
    const env = environments.value.find(env => env.id === id)
    if (env) {
      return createEnvironment({
        name: `${env.name} (副本)`,
        description: env.description,
        variables: { ...env.variables }
      })
    }
    return null
  }
  
  // 添加变量到环境
  const addVariable = (environmentId: string, key: string, value: string) => {
    const env = environments.value.find(env => env.id === environmentId)
    if (env) {
      env.variables[key] = value
      saveToStorage()
      return true
    }
    return false
  }
  
  // 更新变量
  const updateVariable = (environmentId: string, oldKey: string, newKey: string, value: string) => {
    const env = environments.value.find(env => env.id === environmentId)
    if (env) {
      if (oldKey !== newKey) {
        delete env.variables[oldKey]
      }
      env.variables[newKey] = value
      saveToStorage()
      return true
    }
    return false
  }
  
  // 删除变量
  const removeVariable = (environmentId: string, key: string) => {
    const env = environments.value.find(env => env.id === environmentId)
    if (env && key in env.variables) {
      delete env.variables[key]
      saveToStorage()
      return true
    }
    return false
  }
  
  // 解析变量（替换文本中的变量引用）
  const resolveVariables = (text: string): string => {
    if (!text || typeof text !== 'string') return text
    
    const variables = activeVariables.value
    let resolved = text
    
    // 支持 {{variable}} 和 ${variable} 两种格式
    const patterns = [
      /\{\{\s*([^}]+)\s*\}\}/g,  // {{variable}}
      /\$\{\s*([^}]+)\s*\}/g     // ${variable}
    ]
    
    patterns.forEach(pattern => {
      resolved = resolved.replace(pattern, (match, varName) => {
        const trimmedName = varName.trim()
        return variables[trimmedName] !== undefined ? variables[trimmedName] : match
      })
    })
    
    return resolved
  }
  
  // 获取变量引用列表（从文本中提取变量名）
  const getVariableReferences = (text: string): string[] => {
    if (!text || typeof text !== 'string') return []
    
    const references: string[] = []
    const patterns = [
      /\{\{\s*([^}]+)\s*\}\}/g,
      /\$\{\s*([^}]+)\s*\}/g
    ]
    
    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const varName = match[1].trim()
        if (!references.includes(varName)) {
          references.push(varName)
        }
      }
    })
    
    return references
  }
  
  // 验证变量引用（检查是否有未定义的变量）
  const validateVariableReferences = (text: string): { valid: boolean; missingVars: string[] } => {
    const references = getVariableReferences(text)
    const variables = activeVariables.value
    const missingVars = references.filter(ref => !(ref in variables))
    
    return {
      valid: missingVars.length === 0,
      missingVars
    }
  }
  
  // 导出环境配置
  const exportEnvironments = () => {
    const data: StoredEnvironments = {
      environments: environments.value,
      currentId: currentEnvironmentId.value || undefined
    }
    return JSON.stringify(data, null, 2)
  }
  
  // 导入环境配置
  const importEnvironments = (jsonData: string, merge: boolean = false) => {
    try {
      const data: StoredEnvironments = JSON.parse(jsonData)
      if (data.environments && Array.isArray(data.environments)) {
        if (merge) {
          // 合并模式：添加新环境，更新同名环境
          data.environments.forEach(importedEnv => {
            const existingIndex = environments.value.findIndex(env => env.name === importedEnv.name)
            if (existingIndex !== -1) {
              // 更新现有环境
              environments.value[existingIndex] = {
                ...importedEnv,
                id: environments.value[existingIndex].id // 保持原有ID
              }
            } else {
              // 添加新环境
              environments.value.push({
                ...importedEnv,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
              })
            }
          })
        } else {
          // 替换模式：完全替换
          environments.value = data.environments.map(env => ({
            ...env,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }))
        }
        
        // 设置当前环境
        if (data.currentId && environments.value.length > 0) {
          const targetEnv = environments.value.find(env => env.name === data.environments?.find(e => e.id === data.currentId)?.name)
          if (targetEnv) {
            switchEnvironment(targetEnv.id)
          } else {
            switchEnvironment(environments.value[0].id)
          }
        } else if (environments.value.length > 0) {
          switchEnvironment(environments.value[0].id)
        }
        
        saveToStorage()
        return true
      }
    } catch (error) {
      console.error('Failed to import environments:', error)
    }
    return false
  }
  
  // 保存到本地存储
  const saveToStorage = () => {
    try {
      const data: StoredEnvironments = {
        environments: environments.value,
        currentId: currentEnvironmentId.value || undefined
      }
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save environments to storage:', error)
    }
  }
  
  // 保存当前环境ID
  const saveCurrentEnvironment = () => {
    try {
      if (currentEnvironmentId.value) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_ENV, currentEnvironmentId.value)
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ENV)
      }
    } catch (error) {
      console.error('Failed to save current environment:', error)
    }
  }
  
  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      // 加载环境列表
      const stored = localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS)
      if (stored) {
        const data: StoredEnvironments = JSON.parse(stored)
        if (data.environments && Array.isArray(data.environments)) {
          environments.value = data.environments
        }
      }
      
      // 加载当前环境
      const currentEnvId = localStorage.getItem(STORAGE_KEYS.CURRENT_ENV)
      if (currentEnvId && environments.value.find(env => env.id === currentEnvId)) {
        currentEnvironmentId.value = currentEnvId
      } else if (environments.value.length > 0) {
        // 如果没有保存的当前环境，默认选择第一个
        currentEnvironmentId.value = environments.value[0].id
      }
      
    } catch (error) {
      console.error('Failed to load environments from storage:', error)
    }
  }
  
  // 初始化默认环境
  const initializeDefaultEnvironments = () => {
    if (environments.value.length === 0) {
      createEnvironment({
        name: '开发环境',
        description: '本地开发环境配置',
        variables: {
          'baseUrl': 'http://localhost:3000',
          'apiKey': 'dev-api-key',
          'timeout': '30000'
        }
      })
      
      createEnvironment({
        name: '测试环境',
        description: '测试环境配置',
        variables: {
          'baseUrl': 'https://api-test.example.com',
          'apiKey': 'test-api-key',
          'timeout': '30000'
        }
      })
    }
  }
  
  // 初始化时加载数据
  loadFromStorage()
  
  return {
    environments,
    currentEnvironmentId,
    currentEnvironment,
    globalVariables,
    activeVariables,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    switchEnvironment,
    duplicateEnvironment,
    addVariable,
    updateVariable,
    removeVariable,
    resolveVariables,
    getVariableReferences,
    validateVariableReferences,
    exportEnvironments,
    importEnvironments,
    loadFromStorage,
    saveToStorage,
    initializeDefaultEnvironments
  }
})