// 键值对接口
export interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

// 请求配置接口
export interface RequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  headers: KeyValuePair[]
  params: KeyValuePair[]
  timeout?: number
  followRedirects?: boolean
  verifySsl?: boolean
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey'
    token?: string
    username?: string
    password?: string
    key?: string
    value?: string
    in?: 'header' | 'query'
  }
  body: {
    type: 'json' | 'form' | 'raw' | 'binary'
    raw: string
    formData: KeyValuePair[]
  }
}

// 响应数据接口
export interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  duration: number
  size: number
  cookies?: Array<{
    name: string
    value: string
    domain?: string
    path?: string
    expires?: string
    httpOnly?: boolean
    secure?: boolean
  }>
}

// 历史记录项接口
export interface HistoryItem {
  id: string
  name?: string
  request: RequestConfig
  response?: ResponseData
  timestamp: number
  favorite?: boolean
  tags?: string[]
}

// 环境配置接口
export interface Environment {
  id: string
  name: string
  variables: Record<string, string>
  active?: boolean
  description?: string
}

// 用户设置接口
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  layout: 'horizontal' | 'vertical'
  autoSave: boolean
  requestTimeout: number
  verifySsl: boolean
  followRedirects: boolean
  maxHistoryItems: number
  showLineNumbers: boolean
  wordWrap: boolean
}

// 本地存储键名
export const STORAGE_KEYS = {
  HISTORY: 'api-debug-history',
  ENVIRONMENTS: 'api-debug-environments',
  SETTINGS: 'api-debug-settings',
  CURRENT_ENV: 'api-debug-current-env'
} as const

// 历史记录存储结构
export interface StoredHistory {
  items: HistoryItem[]
  maxItems: number
}

// 环境配置存储结构
export interface StoredEnvironments {
  environments: Environment[]
  currentId?: string
}

// 用户设置存储结构
export interface StoredSettings extends UserSettings {
  version: string
  lastUpdated: number
}

// HTTP方法选项
export const HTTP_METHODS = [
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'
] as const

// 认证类型选项
export const AUTH_TYPES = [
  { label: '无认证', value: 'none' },
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'Basic Auth', value: 'basic' },
  { label: 'API Key', value: 'apikey' }
] as const

// 请求体类型
export const BODY_TYPES = [
  { label: 'JSON', value: 'json' },
  { label: 'Form Data', value: 'form' },
  { label: 'Raw', value: 'raw' },
  { label: 'Binary', value: 'binary' }
] as const