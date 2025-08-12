import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { UserSettings, StoredSettings } from '@/types'
import { STORAGE_KEYS } from '@/types'

// 默认设置
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontSize: 'medium',
  layout: 'horizontal',
  autoSave: true,
  requestTimeout: 30000,
  verifySsl: true,
  followRedirects: true,
  maxHistoryItems: 100,
  showLineNumbers: true,
  wordWrap: true
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  
  // 更新设置
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    settings.value = {
      ...settings.value,
      ...newSettings
    }
    saveToStorage()
  }
  
  // 重置设置
  const resetSettings = () => {
    settings.value = { ...DEFAULT_SETTINGS }
    saveToStorage()
  }
  
  // 更新单个设置项
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    settings.value[key] = value
    saveToStorage()
  }
  
  // 切换主题
  const toggleTheme = () => {
    const themes: UserSettings['theme'][] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(settings.value.theme)
    const nextIndex = (currentIndex + 1) % themes.length
    updateSetting('theme', themes[nextIndex])
  }
  
  // 切换布局
  const toggleLayout = () => {
    const newLayout = settings.value.layout === 'horizontal' ? 'vertical' : 'horizontal'
    updateSetting('layout', newLayout)
  }
  
  // 增加字体大小
  const increaseFontSize = () => {
    const sizes: UserSettings['fontSize'][] = ['small', 'medium', 'large']
    const currentIndex = sizes.indexOf(settings.value.fontSize)
    if (currentIndex < sizes.length - 1) {
      updateSetting('fontSize', sizes[currentIndex + 1])
    }
  }
  
  // 减少字体大小
  const decreaseFontSize = () => {
    const sizes: UserSettings['fontSize'][] = ['small', 'medium', 'large']
    const currentIndex = sizes.indexOf(settings.value.fontSize)
    if (currentIndex > 0) {
      updateSetting('fontSize', sizes[currentIndex - 1])
    }
  }
  
  // 导出设置
  const exportSettings = () => {
    const data: StoredSettings = {
      ...settings.value,
      version: '1.0.0',
      lastUpdated: Date.now()
    }
    return JSON.stringify(data, null, 2)
  }
  
  // 导入设置
  const importSettings = (jsonData: string) => {
    try {
      const data: StoredSettings = JSON.parse(jsonData)
      
      // 验证数据格式
      if (typeof data === 'object' && data !== null) {
        // 只导入有效的设置项
        const validSettings: Partial<UserSettings> = {}
        
        Object.keys(DEFAULT_SETTINGS).forEach(key => {
          const settingKey = key as keyof UserSettings
          if (data[settingKey] !== undefined) {
            validSettings[settingKey] = data[settingKey] as any
          }
        })
        
        updateSettings(validSettings)
        return true
      }
    } catch (error) {
      console.error('Failed to import settings:', error)
    }
    return false
  }
  
  // 获取CSS变量（用于主题切换）
  const getCSSVariables = () => {
    const variables: Record<string, string> = {}
    
    // 字体大小
    switch (settings.value.fontSize) {
      case 'small':
        variables['--font-size-base'] = '12px'
        variables['--font-size-small'] = '10px'
        variables['--font-size-large'] = '14px'
        break
      case 'large':
        variables['--font-size-base'] = '16px'
        variables['--font-size-small'] = '14px'
        variables['--font-size-large'] = '18px'
        break
      default: // medium
        variables['--font-size-base'] = '14px'
        variables['--font-size-small'] = '12px'
        variables['--font-size-large'] = '16px'
    }
    
    // 主题颜色
    if (settings.value.theme === 'dark') {
      variables['--bg-color'] = '#1a1a1a'
      variables['--text-color'] = '#ffffff'
      variables['--border-color'] = '#404040'
      variables['--card-bg'] = '#2a2a2a'
    } else {
      variables['--bg-color'] = '#ffffff'
      variables['--text-color'] = '#303133'
      variables['--border-color'] = '#dcdfe6'
      variables['--card-bg'] = '#ffffff'
    }
    
    return variables
  }
  
  // 应用CSS变量到文档
  const applyCSSVariables = () => {
    const variables = getCSSVariables()
    const root = document.documentElement
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // 设置主题类名
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${settings.value.theme}`)
    
    // 设置布局类名
    document.body.className = document.body.className.replace(/layout-\w+/g, '')
    document.body.classList.add(`layout-${settings.value.layout}`)
  }
  
  // 检测系统主题
  const detectSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  
  // 获取实际应用的主题
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (settings.value.theme === 'auto') {
      return detectSystemTheme()
    }
    return settings.value.theme
  }
  
  // 保存到本地存储
  const saveToStorage = () => {
    try {
      const data: StoredSettings = {
        ...settings.value,
        version: '1.0.0',
        lastUpdated: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save settings to storage:', error)
    }
  }
  
  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (stored) {
        const data: StoredSettings = JSON.parse(stored)
        
        // 合并设置，确保所有必需的字段都存在
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...data
        }
      }
    } catch (error) {
      console.error('Failed to load settings from storage:', error)
      settings.value = { ...DEFAULT_SETTINGS }
    }
  }
  
  // 监听系统主题变化
  const setupSystemThemeListener = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleThemeChange = () => {
        if (settings.value.theme === 'auto') {
          applyCSSVariables()
        }
      }
      
      mediaQuery.addEventListener('change', handleThemeChange)
      
      // 返回清理函数
      return () => {
        mediaQuery.removeEventListener('change', handleThemeChange)
      }
    }
    return () => {}
  }
  
  // 监听设置变化，自动应用CSS变量
  watch(
    () => [settings.value.theme, settings.value.fontSize, settings.value.layout],
    () => {
      applyCSSVariables()
    },
    { immediate: true }
  )
  
  // 初始化时加载数据
  loadFromStorage()
  
  // 设置系统主题监听器
  const cleanupThemeListener = setupSystemThemeListener()
  
  return {
    settings,
    updateSettings,
    resetSettings,
    updateSetting,
    toggleTheme,
    toggleLayout,
    increaseFontSize,
    decreaseFontSize,
    exportSettings,
    importSettings,
    getCSSVariables,
    applyCSSVariables,
    detectSystemTheme,
    getEffectiveTheme,
    loadFromStorage,
    saveToStorage,
    cleanupThemeListener
  }
})