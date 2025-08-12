import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  ApiCollection,
  CollectionFolder,
  CollectionRequest,
  ResponseData,
  BatchTestResult,
  HistoryRecord
} from '@shared/types'

// 使用简单的测试结果类型
interface SimpleTestResult {
  testId: string
  name: string
  passed: boolean
  message: string
  duration: number
}

// 本地特定类型定义
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

// ActivityLog 接口暂时未使用
// interface ActivityLog {
//   id: string
//   action: string
//   resource: string
//   resourceId: string
//   details: string
//   timestamp: Date
// }

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

export const useCollectionStore = defineStore('collection', () => {
  const workspaceStore = useWorkspaceStore()
  
  // 状态
  const collections = ref<ApiCollection[]>([])
  const currentCollection = ref<ApiCollection | null>(null)
  const currentRequest = ref<CollectionRequest | null>(null)
  const requestHistory = ref<HistoryRecord[]>([])
  const testResults = ref<SimpleTestResult[]>([])
  const batchTestResults = ref<BatchTestResult[]>([])
  
  // UI状态
  const loading = ref(false)
  const testing = ref(false)
  const importing = ref(false)
  const exporting = ref(false)
  
  // 搜索和过滤
  const searchQuery = ref('')
  const selectedTags = ref<string[]>([])
  const selectedMethods = ref<HttpMethod[]>([])
  
  // 计算属性
  const filteredCollections = computed(() => {
    let filtered = collections.value
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(collection => 
        collection.name.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query) ||
        collection.requests.some(req => 
          req.name.toLowerCase().includes(query) ||
          req.request.url.toLowerCase().includes(query)
        )
      )
    }
    

    
    return filtered
  })
  
  const filteredRequests = computed(() => {
    if (!currentCollection.value) return []
    
    let requests = currentCollection.value.requests
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      requests = requests.filter(req => 
        req.name.toLowerCase().includes(query) ||
        req.request.url.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query)
      )
    }
    
    if (selectedMethods.value.length > 0) {
      requests = requests.filter(req => 
        selectedMethods.value.includes(req.request.method)
      )
    }
    
    return requests
  })
  
  const allTags = computed(() => {
    const tags = new Set<string>()
    collections.value.forEach(collection => {
      collection.requests.forEach(() => {
        // 从请求的描述或名称中提取标签（如果有的话）
        // 这里可以根据实际需求实现标签提取逻辑
      })
    })
    return Array.from(tags)
  })
  

  
  const recentRequests = computed(() => {
    return requestHistory.value
      .slice(0, 10)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  })
  
  const favoriteRequests = computed(() => {
    const favorites: CollectionRequest[] = []
    collections.value.forEach(collection => {
      collection.requests.forEach(() => {
        // 收藏功能需要在其他地方实现，CollectionRequest 类型中没有 isFavorite 属性
        // favorites.push(request)
      })
    })
    return favorites
  })
  
  // 数据加载
  const loadCollections = async () => {
    loading.value = true
    try {
      const savedCollections = await storage.get('collections') || []
      collections.value = savedCollections
      
      const savedHistory = await storage.get('requestHistory') || []
      requestHistory.value = savedHistory
      
      const savedTestResults = await storage.get('testResults') || []
      testResults.value = savedTestResults
    } catch (error) {
      console.error('Failed to load collections:', error)
      ElMessage.error('加载集合失败')
    } finally {
      loading.value = false
    }
  }
  
  const saveCollections = async () => {
    try {
      await storage.set('collections', collections.value)
    } catch (error) {
      console.error('Failed to save collections:', error)
      ElMessage.error('保存集合失败')
    }
  }
  
  const saveHistory = async () => {
    try {
      await storage.set('requestHistory', requestHistory.value)
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }
  
  // 集合管理
  const createCollection = async (collectionData: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCollection: ApiCollection = {
        ...collectionData,
        id: `collection-${Date.now()}`,
        folders: collectionData.folders || [],
        requests: collectionData.requests || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      collections.value.push(newCollection)
      await saveCollections()
      
      await workspaceStore.logActivity({
        action: 'create',
        resource: 'collection',
        resourceId: newCollection.id,
        details: `创建集合: ${newCollection.name}`
      })
      
      ElMessage.success('集合创建成功')
      return newCollection
    } catch (error) {
      console.error('Failed to create collection:', error)
      ElMessage.error('创建集合失败')
      throw error
    }
  }
  
  const updateCollection = async (collectionId: string, updates: Partial<ApiCollection>) => {
    try {
      const collection = collections.value.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }
      
      Object.assign(collection, updates, { updatedAt: new Date() })
      await saveCollections()
      
      await workspaceStore.logActivity({
        action: 'update',
        resource: 'collection',
        resourceId: collectionId,
        details: `更新集合: ${collection.name}`
      })
      
      ElMessage.success('集合更新成功')
    } catch (error) {
      console.error('Failed to update collection:', error)
      ElMessage.error('更新集合失败')
    }
  }
  
  const deleteCollection = async (collectionId: string) => {
    try {
      const collectionIndex = collections.value.findIndex(c => c.id === collectionId)
      if (collectionIndex === -1) return
      
      const collection = collections.value[collectionIndex]
      collections.value.splice(collectionIndex, 1)
      await saveCollections()
      
      // 清理相关的历史记录
      requestHistory.value = requestHistory.value.filter(h => h.collectionId !== collectionId)
      await saveHistory()
      
      await workspaceStore.logActivity({
        action: 'delete',
        resource: 'collection',
        resourceId: collectionId,
        details: `删除集合: ${collection.name}`
      })
      
      ElMessage.success('集合删除成功')
    } catch (error) {
      console.error('Failed to delete collection:', error)
      ElMessage.error('删除集合失败')
    }
  }
  
  const duplicateCollection = async (collectionId: string) => {
    try {
      const originalCollection = collections.value.find(c => c.id === collectionId)
      if (!originalCollection) {
        throw new Error('Collection not found')
      }
      
      const duplicatedCollection: ApiCollection = {
        ...originalCollection,
        id: `collection-${Date.now()}`,
        name: `${originalCollection.name} (副本)`,
        folders: originalCollection.folders || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        requests: originalCollection.requests.map(req => ({
          ...req,
          id: `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      }
      
      collections.value.push(duplicatedCollection)
      await saveCollections()
      
      await workspaceStore.logActivity({
        action: 'duplicate',
        resource: 'collection',
        resourceId: duplicatedCollection.id,
        details: `复制集合: ${originalCollection.name}`
      })
      
      ElMessage.success('集合复制成功')
      return duplicatedCollection
    } catch (error) {
      console.error('Failed to duplicate collection:', error)
      ElMessage.error('复制集合失败')
      throw error
    }
  }
  
  // 文件夹管理
  const createFolder = async (collectionId: string, folderData: Omit<CollectionFolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const collection = collections.value.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }
      
      const newFolder: CollectionFolder = {
        ...folderData,
        id: `folder-${Date.now()}`,
        requests: folderData.requests || [],
        folders: folderData.folders || []
      }
      
      if (!collection.folders) {
        collection.folders = []
      }
      collection.folders.push(newFolder)
      collection.updatedAt = new Date()
      
      await saveCollections()
      
      await workspaceStore.logActivity({
        action: 'create',
        resource: 'folder',
        resourceId: newFolder.id,
        details: `创建文件夹: ${newFolder.name}`
      })
      
      ElMessage.success('文件夹创建成功')
      return newFolder
    } catch (error) {
      console.error('Failed to create folder:', error)
      ElMessage.error('创建文件夹失败')
      throw error
    }
  }
  
  // 请求管理
  const createRequest = async (collectionId: string, requestData: Omit<CollectionRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const collection = collections.value.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }
      
      const newRequest: CollectionRequest = {
        ...requestData,
        id: `request-${Date.now()}`
        // CollectionRequest 类型中没有 createdAt 和 updatedAt 属性
      }
      
      collection.requests.push(newRequest)
      collection.updatedAt = new Date()
      
      await saveCollections()
      
      await workspaceStore.logActivity({
        action: 'create',
        resource: 'request',
        resourceId: newRequest.id,
        details: `创建请求: ${newRequest.name}`
      })
      
      ElMessage.success('请求创建成功')
      return newRequest
    } catch (error) {
      console.error('Failed to create request:', error)
      ElMessage.error('创建请求失败')
      throw error
    }
  }
  
  const updateRequest = async (collectionId: string, requestId: string, updates: Partial<CollectionRequest>) => {
    try {
      const collection = collections.value.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }
      
      const request = collection.requests.find(r => r.id === requestId)
      if (!request) {
        throw new Error('Request not found')
      }
      
      Object.assign(request, updates, { updatedAt: new Date() })
      collection.updatedAt = new Date()
      
      await saveCollections()
      
      await workspaceStore.logActivity({
        action: 'update',
        resource: 'request',
        resourceId: requestId,
        details: `更新请求: ${request.name}`
      })
      
      ElMessage.success('请求更新成功')
    } catch (error) {
      console.error('Failed to update request:', error)
      ElMessage.error('更新请求失败')
    }
  }
  
  const deleteRequest = async (collectionId: string, requestId: string) => {
    try {
      const collection = collections.value.find(c => c.id === collectionId)
      if (!collection) return
      
      const requestIndex = collection.requests.findIndex(r => r.id === requestId)
      if (requestIndex === -1) return
      
      const request = collection.requests[requestIndex]
      collection.requests.splice(requestIndex, 1)
      collection.updatedAt = new Date()
      
      await saveCollections()
      
      // 清理相关的历史记录
      requestHistory.value = requestHistory.value.filter(h => h.id !== requestId)
      await saveHistory()
      
      await workspaceStore.logActivity({
        action: 'delete',
        resource: 'request',
        resourceId: requestId,
        details: `删除请求: ${request.name}`
      })
      
      ElMessage.success('请求删除成功')
    } catch (error) {
      console.error('Failed to delete request:', error)
      ElMessage.error('删除请求失败')
    }
  }
  
  const toggleFavorite = async (collectionId: string, requestId: string) => {
    try {
      const collection = collections.value.find(c => c.id === collectionId)
      if (!collection) return
      
      const request = collection.requests.find(r => r.id === requestId)
      if (!request) return
      
      // 收藏功能需要在其他地方实现，CollectionRequest 类型中没有 isFavorite 属性
      // CollectionRequest 类型中没有 updatedAt 属性
      collection.updatedAt = new Date()
      
      await saveCollections()
      
      const action = '切换收藏状态'
      ElMessage.success(`${action}: ${request.name}`)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      ElMessage.error('操作失败')
    }
  }
  
  // 请求执行
  const executeRequest = async (request: CollectionRequest) => {
    testing.value = true
    try {
      // 这里应该实现实际的HTTP请求逻辑
      // 暂时使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const response: ResponseData = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'content-length': '123'
        },
        data: { message: 'Success', timestamp: new Date().toISOString() },
        duration: Math.floor(Math.random() * 1000) + 100,
        size: 123
      }
      
      // 记录到历史
      const historyRecord: HistoryRecord = {
        id: `history-${Date.now()}`,
        request: request.request,
        response,
        timestamp: new Date(),
        success: true,
        collectionId: currentCollection.value?.id || ''
      }
      
      requestHistory.value.unshift(historyRecord)
      
      // 只保留最近1000条记录
      if (requestHistory.value.length > 1000) {
        requestHistory.value = requestHistory.value.slice(0, 1000)
      }
      
      await saveHistory()
      
      await workspaceStore.logActivity({
        action: 'execute',
        resource: 'request',
        resourceId: request.id,
        details: `执行请求: ${request.name}`
      })
      
      return response
    } catch (error) {
      console.error('Failed to execute request:', error)
      
      const errorResponse: ResponseData = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        duration: 0,
        size: 0
      }
      
      // 记录错误到历史
      const historyRecord: HistoryRecord = {
        id: `history-${Date.now()}`,
        request: request.request,
        response: errorResponse,
        timestamp: new Date(),
        success: false,
        collectionId: currentCollection.value?.id || ''
      }
      
      requestHistory.value.unshift(historyRecord)
      await saveHistory()
      
      throw error
    } finally {
      testing.value = false
    }
  }
  
  // 批量测试
  const runBatchTest = async (collectionId: string, requests: CollectionRequest[]) => {
    testing.value = true
    try {
      const results: SimpleTestResult[] = []
      
      for (const request of requests) {
        try {
          const response = await executeRequest(request)
          results.push({
            testId: `test-${request.id}`,
            name: request.name,
            passed: true,
            message: 'Request executed successfully',
            duration: response.duration || 0
          })
        } catch (error) {
          results.push({
            testId: `test-${request.id}`,
            name: request.name,
            passed: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            duration: 0
          })
        }
      }
      
      const passedCount = results.filter(r => r.passed).length
      const failedCount = results.filter(r => !r.passed).length
      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
      
      // 记录批量测试结果（简化版本）
      const batchSummary = {
        total: results.length,
        passed: passedCount,
        failed: failedCount,
        duration: totalDuration
      }
      
      await workspaceStore.logActivity({
        action: 'batch_test',
        resource: 'collection',
        resourceId: collectionId,
        details: `批量测试完成: ${batchSummary.passed}/${batchSummary.total} 通过`
      })
      
      ElMessage.success(`批量测试完成: ${batchSummary.passed}/${batchSummary.total} 通过`)
      return batchSummary
    } catch (error) {
      console.error('Failed to run batch test:', error)
      ElMessage.error('批量测试失败')
      throw error
    } finally {
      testing.value = false
    }
  }
  
  // 数据导入导出
  const importCollection = async (data: any, format: 'postman' | 'openapi' | 'insomnia') => {
    importing.value = true
    try {
      let collection: ApiCollection
      
      switch (format) {
        case 'postman':
          collection = await importFromPostman(data)
          break
        case 'openapi':
          collection = await importFromOpenAPI(data)
          break
        case 'insomnia':
          collection = await importFromInsomnia(data)
          break
        default:
          throw new Error('Unsupported format')
      }
      
      collections.value.push(collection)
      await saveCollections()
      
      await workspaceStore.logActivity({
        action: 'import',
        resource: 'collection',
        resourceId: collection.id,
        details: `导入集合: ${collection.name} (${format})`
      })
      
      ElMessage.success('集合导入成功')
      return collection
    } catch (error) {
      console.error('Failed to import collection:', error)
      ElMessage.error('导入集合失败')
      throw error
    } finally {
      importing.value = false
    }
  }
  
  const exportCollection = async (collectionId: string, format: 'postman' | 'openapi' | 'insomnia') => {
    exporting.value = true
    try {
      const collection = collections.value.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }
      
      let exportData: any
      
      switch (format) {
        case 'postman':
          exportData = await exportToPostman(collection)
          break
        case 'openapi':
          exportData = await exportToOpenAPI(collection)
          break
        case 'insomnia':
          exportData = await exportToInsomnia(collection)
          break
        default:
          throw new Error('Unsupported format')
      }
      
      await workspaceStore.logActivity({
        action: 'export',
        resource: 'collection',
        resourceId: collectionId,
        details: `导出集合: ${collection.name} (${format})`
      })
      
      ElMessage.success('集合导出成功')
      return exportData
    } catch (error) {
      console.error('Failed to export collection:', error)
      ElMessage.error('导出集合失败')
      throw error
    } finally {
      exporting.value = false
    }
  }
  
  // 辅助函数（简化实现）
  const importFromPostman = async (data: any): Promise<ApiCollection> => {
    // 简化的Postman导入逻辑
    return {
      id: `collection-${Date.now()}`,
      name: data.info?.name || 'Imported Collection',
      description: data.info?.description || '',
      folders: [],
      requests: [], // 这里应该解析Postman的请求格式
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
  
  const importFromOpenAPI = async (data: any): Promise<ApiCollection> => {
    // 简化的OpenAPI导入逻辑
    return {
      id: `collection-${Date.now()}`,
      name: data.info?.title || 'Imported Collection',
      description: data.info?.description || '',
      folders: [],
      requests: [], // 这里应该解析OpenAPI的路径格式
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
  
  const importFromInsomnia = async (data: any): Promise<ApiCollection> => {
    // 简化的Insomnia导入逻辑
    return {
      id: `collection-${Date.now()}`,
      name: data.name || 'Imported Collection',
      description: data.description || '',
      folders: [],
      requests: [], // 这里应该解析Insomnia的请求格式
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
  
  const exportToPostman = async (collection: ApiCollection) => {
    // 简化的Postman导出逻辑
    return {
      info: {
        name: collection.name,
        description: collection.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [] // 这里应该转换为Postman格式
    }
  }
  
  const exportToOpenAPI = async (collection: ApiCollection) => {
    // 简化的OpenAPI导出逻辑
    return {
      openapi: '3.0.0',
      info: {
        title: collection.name,
        description: collection.description,
        version: '1.0.0'
      },
      paths: {} // 这里应该转换为OpenAPI格式
    }
  }
  
  const exportToInsomnia = async (collection: ApiCollection) => {
    // 简化的Insomnia导出逻辑
    return {
      _type: 'export',
      __export_format: 4,
      resources: [], // 这里应该转换为Insomnia格式
      name: collection.name // 使用 collection 参数避免未使用警告
    }
  }
  
  // 监听数据变化
  watch(collections, () => {
    saveCollections()
  }, { deep: true })
  
  watch(requestHistory, () => {
    saveHistory()
  }, { deep: true })
  
  return {
    // 状态
    collections,
    currentCollection,
    currentRequest,
    requestHistory,
    testResults,
    batchTestResults,
    loading,
    testing,
    importing,
    exporting,
    searchQuery,
    selectedTags,
    selectedMethods,
    
    // 计算属性
    filteredCollections,
    filteredRequests,
    allTags,
    recentRequests,
    favoriteRequests,
    
    // 方法
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    duplicateCollection,
    createFolder,
    createRequest,
    updateRequest,
    deleteRequest,
    toggleFavorite,
    executeRequest,
    runBatchTest,
    importCollection,
    exportCollection
  }
})