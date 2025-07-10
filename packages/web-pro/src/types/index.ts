// 导出shared包中的类型
export * from '@onlineInterfaceDebugTool/shared/types'

// Pro版本特有的类型扩展
export interface ProConfig {
  version: string
  features: string[]
  limits: {
    maxTeamMembers: number
    maxProjects: number
    maxApiCalls: number
  }
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member' | 'viewer'
  permissions: string[]
  lastLogin?: number
  createdAt: number
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  read: boolean
  actions?: {
    label: string
    action: () => void
  }[]
}