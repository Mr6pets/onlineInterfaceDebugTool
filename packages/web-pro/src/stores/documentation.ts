import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  ApiDocumentation, 
  DocSection, 
  ApiEndpoint, 
  DocTheme,
  JsonSchema 
} from '@/types'

export const useDocumentationStore = defineStore('documentation', () => {
  // 状态
  const documentations = ref<ApiDocumentation[]>([])
  const currentDocumentation = ref<ApiDocumentation | null>(null)
  const currentTheme = ref<DocTheme>(getDefaultTheme())
  const loading = ref(false)
  const searchQuery = ref('')
  const selectedStatus = ref<string>('')
  const selectedTags = ref<string[]>([])
  
  // 计算属性
  const filteredDocumentations = computed(() => {
    let filtered = documentations.value
    
    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // 状态过滤
    if (selectedStatus.value) {
      filtered = filtered.filter(doc => doc.status === selectedStatus.value)
    }
    
    // 标签过滤
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(doc => 
        doc.tags?.some(tag => selectedTags.value.includes(tag))
      )
    }
    
    return filtered
  })
  
  const allTags = computed(() => {
    const tags = new Set<string>()
    documentations.value.forEach(doc => {
      doc.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  })
  
  const documentationStats = computed(() => {
    const total = documentations.value.length
    const published = documentations.value.filter(doc => doc.status === 'published').length
    const draft = documentations.value.filter(doc => doc.status === 'draft').length
    const archived = documentations.value.filter(doc => doc.status === 'archived').length
    
    return { total, published, draft, archived }
  })
  
  // 操作方法
  const fetchDocumentations = async () => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟数据
      documentations.value = [
        {
          id: '1',
          title: '用户管理API',
          description: '用户注册、登录、信息管理相关接口',
          version: '1.0.0',
          status: 'published',
          tags: ['用户', '认证'],
          baseUrl: 'https://api.example.com',
          published: true,
          publishedUrl: 'https://docs.example.com/user-api',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          createdBy: 'dev-team',
          settings: {
            logo: '/logo.png',
            favicon: '/favicon.ico'
          },
          theme: {
            primaryColor: '#409EFF',
            secondaryColor: '#67C23A',
            fontFamily: 'system',
            layout: 'sidebar',
            codeTheme: 'light'
          },
          sections: [
             {
               id: 'user-auth',
               type: 'endpoints',
               title: '用户认证',
               content: '用户登录注册相关接口',
               order: 1,
               visible: true,
               endpoints: [
                {
                   id: 'login',
                   method: 'POST',
                   path: '/api/auth/login',
                   summary: '用户登录',
                   description: '用户通过邮箱和密码登录系统',
                   tags: ['认证'],
                   parameters: [],
                  requestBody: {
                     required: true,
                     contentType: 'application/json',
                     schema: {
                       type: 'object',
                       properties: {
                         email: { type: 'string', description: '用户邮箱' },
                         password: { type: 'string', description: '用户密码' }
                       },
                       required: ['email', 'password']
                     },
                     examples: {
                       default: {
                         email: 'user@example.com',
                         password: 'password123'
                       }
                     }
                   },
                   responses: [
                     {
                       statusCode: 200,
                       description: '登录成功',
                       contentType: 'application/json',
                       schema: {
                         type: 'object',
                         properties: {
                           token: { type: 'string', description: '访问令牌' },
                           user: {
                             type: 'object',
                             properties: {
                               id: { type: 'string' },
                               email: { type: 'string' },
                               name: { type: 'string' }
                             }
                           }
                         }
                       },
                       examples: {
                         default: {
                           token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                           user: {
                             id: '123',
                             email: 'user@example.com',
                             name: '用户名'
                           }
                         }
                       }
                     },
                     {
                       statusCode: 401,
                       description: '认证失败',
                       contentType: 'application/json',
                       schema: {
                         type: 'object',
                         properties: {
                           error: { type: 'string' },
                           message: { type: 'string' }
                         }
                       },
                       examples: {
                         default: {
                           error: 'INVALID_CREDENTIALS',
                           message: '邮箱或密码错误'
                         }
                       }
                     }
                   ],
                  examples: [
                     {
                       name: 'cURL示例',
                       description: '使用cURL调用登录接口',
                       request: {
                         body: {
                           email: 'user@example.com',
                           password: 'password123'
                         }
                       },
                       response: {
                         statusCode: 200,
                         body: {
                           token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                           user: {
                             id: '123',
                             email: 'user@example.com',
                             name: '用户名'
                           }
                         }
                       }
                     }
                   ]
                }
              ]
            }
          ]
        },
        {
          id: '2',
          title: '订单管理API',
          description: '电商订单创建、查询、管理相关接口',
          version: '2.1.0',
          status: 'draft',
          tags: ['订单', '电商'],
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          sections: [],
          settings: {
            logo: '/logo.png',
            favicon: '/favicon.ico'
          },
          theme: {
            primaryColor: '#409EFF',
            secondaryColor: '#67C23A',
            fontFamily: 'system',
            layout: 'sidebar',
            codeTheme: 'light'
          },
          published: false,
          baseUrl: 'https://api.example.com',
          createdBy: 'dev-team'
        }
      ]
    } catch (error) {
      console.error('获取文档列表失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  const createDocumentation = async (data: Partial<ApiDocumentation>) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newDoc: ApiDocumentation = {
          id: Date.now().toString(),
          title: data.title || '未命名文档',
          description: data.description || '',
          version: data.version || '1.0.0',
          baseUrl: data.baseUrl || 'https://api.example.com',
          sections: data.sections || [],
          settings: data.settings || {
            logo: '/logo.png',
            favicon: '/favicon.ico'
          },
          theme: data.theme || {
            primaryColor: '#409EFF',
            secondaryColor: '#67C23A',
            fontFamily: 'system',
            layout: 'sidebar',
            codeTheme: 'light'
          },
          published: data.published || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: data.createdBy || 'unknown'
        }
      
      documentations.value.unshift(newDoc)
      return newDoc
    } catch (error) {
      console.error('创建文档失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const updateDocumentation = async (id: string, data: Partial<ApiDocumentation>) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const index = documentations.value.findIndex(doc => doc.id === id)
      if (index !== -1) {
        documentations.value[index] = {
          ...documentations.value[index],
          ...data,
          updatedAt: new Date()
        }
        
        // 更新当前文档
        if (currentDocumentation.value?.id === id) {
          currentDocumentation.value = documentations.value[index]
        }
        
        return documentations.value[index]
      }
      throw new Error('文档不存在')
    } catch (error) {
      console.error('更新文档失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const deleteDocumentation = async (id: string) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const index = documentations.value.findIndex(doc => doc.id === id)
      if (index !== -1) {
        documentations.value.splice(index, 1)
        
        // 清除当前文档
        if (currentDocumentation.value?.id === id) {
          currentDocumentation.value = null
        }
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const duplicateDocumentation = async (id: string) => {
    const original = documentations.value.find(doc => doc.id === id)
    if (!original) throw new Error('文档不存在')
    
    return createDocumentation({
      ...original,
      title: `${original.title} (副本)`,
      status: 'draft'
    })
  }
  
  const publishDocumentation = async (id: string) => {
    return updateDocumentation(id, { status: 'published' })
  }
  
  const archiveDocumentation = async (id: string) => {
    return updateDocumentation(id, { status: 'archived' })
  }
  
  const setCurrentDocumentation = (doc: ApiDocumentation | null) => {
    currentDocumentation.value = doc
  }
  
  const addDocSection = (section: DocSection) => {
    if (!currentDocumentation.value) return
    
    currentDocumentation.value.sections = currentDocumentation.value.sections || []
    currentDocumentation.value.sections.push({
      ...section,
      id: Date.now().toString()
    })
  }
  
  const updateDocSection = (sectionId: string, data: Partial<DocSection>) => {
    if (!currentDocumentation.value?.sections) return
    
    const index = currentDocumentation.value.sections.findIndex(section => section.id === sectionId)
    if (index !== -1) {
      currentDocumentation.value.sections[index] = {
        ...currentDocumentation.value.sections[index],
        ...data
      }
    }
  }
  
  const deleteDocSection = (sectionId: string) => {
    if (!currentDocumentation.value?.sections) return
    
    const index = currentDocumentation.value.sections.findIndex(section => section.id === sectionId)
    if (index !== -1) {
      currentDocumentation.value.sections.splice(index, 1)
    }
  }
  
  const addEndpoint = (sectionId: string, endpoint: ApiEndpoint) => {
    if (!currentDocumentation.value?.sections) return
    
    const section = currentDocumentation.value.sections.find(s => s.id === sectionId)
    if (section) {
      section.endpoints = section.endpoints || []
      section.endpoints.push({
        ...endpoint,
        id: Date.now().toString()
      })
    }
  }
  
  const updateEndpoint = (sectionId: string, endpointId: string, data: Partial<ApiEndpoint>) => {
    if (!currentDocumentation.value?.sections) return
    
    const section = currentDocumentation.value.sections.find(s => s.id === sectionId)
    if (section?.endpoints) {
      const index = section.endpoints.findIndex(endpoint => endpoint.id === endpointId)
      if (index !== -1) {
        section.endpoints[index] = {
          ...section.endpoints[index],
          ...data
        }
      }
    }
  }
  
  const deleteEndpoint = (sectionId: string, endpointId: string) => {
    if (!currentDocumentation.value?.sections) return
    
    const section = currentDocumentation.value.sections.find(s => s.id === sectionId)
    if (section?.endpoints) {
      const index = section.endpoints.findIndex(endpoint => endpoint.id === endpointId)
      if (index !== -1) {
        section.endpoints.splice(index, 1)
      }
    }
  }
  
  const duplicateEndpoint = (sectionId: string, endpointId: string) => {
    if (!currentDocumentation.value?.sections) return
    
    const section = currentDocumentation.value.sections.find(s => s.id === sectionId)
    if (section?.endpoints) {
      const original = section.endpoints.find(endpoint => endpoint.id === endpointId)
      if (original) {
        addEndpoint(sectionId, {
          ...original,
          summary: `${original.summary} (副本)`
        })
      }
    }
  }
  
  const importFromCollection = async (collectionId: string) => {
    loading.value = true
    try {
      // 模拟从集合导入API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 这里应该调用实际的API来获取集合数据
      // 然后转换为文档格式
      
      console.log('从集合导入API:', collectionId)
    } catch (error) {
      console.error('导入失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const exportDocumentation = async (id: string, format: 'json' | 'yaml' | 'html' | 'pdf') => {
    const doc = documentations.value.find(d => d.id === id)
    if (!doc) throw new Error('文档不存在')
    
    // 模拟导出
    const data = JSON.stringify(doc, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title}.${format}`
    a.click()
    
    URL.revokeObjectURL(url)
  }
  
  const updateTheme = (theme: Partial<DocTheme>) => {
    currentTheme.value = {
      ...currentTheme.value,
      ...theme
    }
  }
  
  const resetTheme = () => {
    currentTheme.value = getDefaultTheme()
  }
  
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }
  
  const setStatusFilter = (status: string) => {
    selectedStatus.value = status
  }
  
  const setTagsFilter = (tags: string[]) => {
    selectedTags.value = tags
  }
  
  const clearFilters = () => {
    searchQuery.value = ''
    selectedStatus.value = ''
    selectedTags.value = []
  }
  
  return {
    // 状态
    documentations,
    currentDocumentation,
    currentTheme,
    loading,
    searchQuery,
    selectedStatus,
    selectedTags,
    
    // 计算属性
    filteredDocumentations,
    allTags,
    documentationStats,
    
    // 方法
    fetchDocumentations,
    createDocumentation,
    updateDocumentation,
    deleteDocumentation,
    duplicateDocumentation,
    publishDocumentation,
    archiveDocumentation,
    setCurrentDocumentation,
    
    // 文档章节管理
    addDocSection,
    updateDocSection,
    deleteDocSection,
    
    // API端点管理
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    duplicateEndpoint,
    
    // 导入导出
    importFromCollection,
    exportDocumentation,
    
    // 主题管理
    updateTheme,
    resetTheme,
    
    // 过滤器
    setSearchQuery,
    setStatusFilter,
    setTagsFilter,
    clearFilters
  }
})

// 默认主题
function getDefaultTheme(): DocTheme {
  return {
    colors: {
      primary: '#409EFF',
      success: '#67C23A',
      warning: '#E6A23C',
      error: '#F56C6C',
      info: '#909399',
      background: '#ffffff',
      surface: '#ffffff',
      sidebar: '#f8f9fa',
      header: '#ffffff',
      textPrimary: '#303133',
      textSecondary: '#606266',
      textDisabled: '#C0C4CC',
      link: '#409EFF'
    },
    layout: {
      mode: 'sidebar',
      width: 'fluid',
      maxWidth: 1200
    },
    typography: {
      fontFamily: 'system',
      fontSize: 14,
      lineHeight: 1.5
    },
    components: {
      button: {
        borderRadius: 4,
        height: 32
      },
      card: {
        borderRadius: 6,
        shadow: 'small'
      },
      table: {
        stripe: true,
        border: true,
        size: 'default'
      }
    }
  }
}