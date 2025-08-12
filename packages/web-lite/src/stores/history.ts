import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HistoryItem, StoredHistory } from '@/types'
import { STORAGE_KEYS } from '@/types'

export const useHistoryStore = defineStore('history', () => {
  const items = ref<HistoryItem[]>([])
  const searchText = ref('')
  const filterType = ref('all') // all, favorite, method
  const selectedMethod = ref('')
  const maxItems = ref(100)
  
  // 计算属性：过滤后的历史记录
  const filteredItems = computed(() => {
    let filtered = items.value
    
    // 按搜索文本过滤
    if (searchText.value) {
      const search = searchText.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(search) ||
        item.request.url.toLowerCase().includes(search) ||
        item.request.method.toLowerCase().includes(search)
      )
    }
    
    // 按类型过滤
    if (filterType.value === 'favorite') {
      filtered = filtered.filter(item => item.favorite)
    } else if (filterType.value === 'method' && selectedMethod.value) {
      filtered = filtered.filter(item => item.request.method === selectedMethod.value)
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  })
  
  // 计算属性：收藏的历史记录
  const favoriteItems = computed(() => 
    items.value.filter(item => item.favorite)
  )
  
  // 计算属性：按方法分组的统计
  const methodStats = computed(() => {
    const stats: Record<string, number> = {}
    items.value.forEach(item => {
      const method = item.request.method
      stats[method] = (stats[method] || 0) + 1
    })
    return stats
  })
  
  // 添加历史记录项
  const addItem = (item: Omit<HistoryItem, 'id'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: item.id || Date.now().toString()
    }
    
    // 检查是否已存在相同的请求
    const existingIndex = items.value.findIndex(existing => 
      existing.request.url === newItem.request.url &&
      existing.request.method === newItem.request.method &&
      JSON.stringify(existing.request.data) === JSON.stringify(newItem.request.data)
    )
    
    if (existingIndex !== -1) {
      // 更新现有记录
      items.value[existingIndex] = {
        ...items.value[existingIndex],
        ...newItem,
        timestamp: Date.now()
      }
    } else {
      // 添加新记录
      items.value.unshift(newItem)
    }
    
    // 限制历史记录数量
    if (items.value.length > maxItems.value) {
      items.value = items.value.slice(0, maxItems.value)
    }
    
    saveToStorage()
  }
  
  // 删除历史记录项
  const removeItem = (id: string) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
      saveToStorage()
    }
  }
  
  // 切换收藏状态
  const toggleFavorite = (id: string) => {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.favorite = !item.favorite
      saveToStorage()
    }
  }
  
  // 更新历史记录项名称
  const updateItemName = (id: string, name: string) => {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.name = name
      saveToStorage()
    }
  }
  
  // 添加标签
  const addTag = (id: string, tag: string) => {
    const item = items.value.find(item => item.id === id)
    if (item) {
      if (!item.tags) item.tags = []
      if (!item.tags.includes(tag)) {
        item.tags.push(tag)
        saveToStorage()
      }
    }
  }
  
  // 删除标签
  const removeTag = (id: string, tag: string) => {
    const item = items.value.find(item => item.id === id)
    if (item && item.tags) {
      const index = item.tags.indexOf(tag)
      if (index !== -1) {
        item.tags.splice(index, 1)
        saveToStorage()
      }
    }
  }
  
  // 清空历史记录
  const clearHistory = () => {
    items.value = []
    saveToStorage()
  }
  
  // 清空非收藏的历史记录
  const clearNonFavorites = () => {
    items.value = items.value.filter(item => item.favorite)
    saveToStorage()
  }
  
  // 搜索历史记录
  const searchItems = (text: string) => {
    searchText.value = text
  }
  
  // 设置过滤器
  const setFilter = (type: string, method?: string) => {
    filterType.value = type
    if (method) {
      selectedMethod.value = method
    }
  }
  
  // 导出历史记录
  const exportHistory = () => {
    const data: StoredHistory = {
      items: items.value,
      maxItems: maxItems.value
    }
    return JSON.stringify(data, null, 2)
  }
  
  // 导入历史记录
  const importHistory = (jsonData: string) => {
    try {
      const data: StoredHistory = JSON.parse(jsonData)
      if (data.items && Array.isArray(data.items)) {
        items.value = data.items
        if (data.maxItems) {
          maxItems.value = data.maxItems
        }
        saveToStorage()
        return true
      }
    } catch (error) {
      console.error('Failed to import history:', error)
    }
    return false
  }
  
  // 保存到本地存储
  const saveToStorage = () => {
    try {
      const data: StoredHistory = {
        items: items.value,
        maxItems: maxItems.value
      }
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save history to storage:', error)
    }
  }
  
  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY)
      if (stored) {
        const data: StoredHistory = JSON.parse(stored)
        if (data.items && Array.isArray(data.items)) {
          items.value = data.items
        }
        if (data.maxItems) {
          maxItems.value = data.maxItems
        }
      }
    } catch (error) {
      console.error('Failed to load history from storage:', error)
    }
  }
  
  // 初始化时加载数据
  loadFromStorage()
  
  return {
    items,
    searchText,
    filterType,
    selectedMethod,
    maxItems,
    filteredItems,
    favoriteItems,
    methodStats,
    addItem,
    removeItem,
    toggleFavorite,
    updateItemName,
    addTag,
    removeTag,
    clearHistory,
    clearNonFavorites,
    searchItems,
    setFilter,
    exportHistory,
    importHistory,
    loadFromStorage,
    saveToStorage
  }
})