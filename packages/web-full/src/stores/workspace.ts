import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { 
  Workspace, 
  ApiCollection, 
  Environment, 
  BatchTest,
  ImportData,
  ExportData 
} from '@api-debug-tool/shared/types'
import { storage } from '@api-debug-tool/shared/utils/storage'

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentWorkspace = ref<Workspace | null>(null)
  const collections = ref<ApiCollection[]>([])
  const environments = ref<Environment[]>([])
  const batchTests = ref<BatchTest[]>([])
  
  // 加载工作空间
  const loadWorkspace = () => {
    const workspace = storage.get('current_workspace')
    const savedCollections = storage.get('collections') || []
    const savedEnvironments = storage.get('environments') || []
    const savedBatchTests = storage.get('batch_tests') || []
    
    if (workspace) {
      currentWorkspace.value = workspace
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
      storage.set('current_workspace', defaultWorkspace)
    }
    
    collections.value = savedCollections
    environments.value = savedEnvironments
    batchTests.value = savedBatchTests
    
    // 创建默认环境
    if (environments.value.length === 0) {
      const defaultEnv: Environment = {
        id: 'default',
        name: '默认环境',
        variables: {},
        isActive: true,
        baseUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      environments.value.push(defaultEnv)
      saveEnvironments()
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
  
  return {
    currentWorkspace,
    collections,
    environments,
    batchTests,
    loadWorkspace,
    saveWorkspace,
    saveEnvironment,
    deleteEnvironment,
    saveCollection,
    deleteCollection,
    saveBatchTest,
    deleteBatchTest,
    importData,
    exportWorkspace
  }
})