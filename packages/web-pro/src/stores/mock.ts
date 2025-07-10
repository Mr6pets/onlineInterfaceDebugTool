import { defineStore } from 'pinia'
import type { 
  MockRoute, 
  MockServerSettings, 
  MockCondition,
  MockResponse,
  MockMiddleware
} from '@/types'

interface MockState {
  routes: MockRoute[]
  settings: MockServerSettings
  requestLogs: any[]
  serverInstance: any
  isRunning: boolean
}

export const useMockStore = defineStore('mock', {
  state: (): MockState => ({
    routes: [],
    settings: {
      port: 3001,
      host: 'localhost',
      cors: true,
      logLevel: 'info',
      maxLogs: 1000
    },
    requestLogs: [],
    serverInstance: null,
    isRunning: false
  }),

  getters: {
    activeRoutes: (state) => state.routes.filter(route => route.enabled),
    routesByMethod: (state) => (method: string) => 
      state.routes.filter(route => route.method === method),
    recentLogs: (state) => state.requestLogs.slice(-50)
  },

  actions: {
    // Route management
    async createRoute(route: Omit<MockRoute, 'id' | 'hitCount' | 'lastHit'>) {
      const newRoute: MockRoute = {
        ...route,
        id: Date.now().toString(),
        hitCount: 0,
        lastHit: undefined,
        enabled: route.enabled ?? true
      }
      
      this.routes.push(newRoute)
      await this.saveRoutes()
      return newRoute
    },

    async updateRoute(id: string, updates: Partial<MockRoute>) {
      const index = this.routes.findIndex(route => route.id === id)
      if (index !== -1) {
        this.routes[index] = { ...this.routes[index], ...updates }
        await this.saveRoutes()
      }
    },

    async deleteRoute(id: string) {
      const index = this.routes.findIndex(route => route.id === id)
      if (index !== -1) {
        this.routes.splice(index, 1)
        await this.saveRoutes()
      }
    },

    async duplicateRoute(id: string) {
      const route = this.routes.find(r => r.id === id)
      if (route) {
        const newRoute = {
          ...route,
          id: Date.now().toString(),
          path: route.path + '_copy',
          hitCount: 0,
          lastHit: undefined
        }
        this.routes.push(newRoute)
        await this.saveRoutes()
        return newRoute
      }
    },

    // Server management
    async startServer(settings?: MockServerSettings) {
      if (settings) {
        this.settings = { ...this.settings, ...settings }
      }

      try {
        // 模拟启动服务器
        this.serverInstance = {
          port: this.settings.port,
          host: this.settings.host,
          startTime: Date.now()
        }
        
        this.isRunning = true
        
        // 开始监听路由请求（模拟）
        this.startRequestMonitoring()
        
        return this.serverInstance
      } catch (error) {
        throw new Error(`启动服务器失败: ${error.message}`)
      }
    },

    async stopServer() {
      if (this.serverInstance) {
        this.serverInstance = null
        this.isRunning = false
      }
    },

    // Request monitoring
    startRequestMonitoring() {
      // 模拟请求监听
      setInterval(() => {
        if (this.isRunning && Math.random() > 0.8) {
          this.simulateRequest()
        }
      }, 5000)
    },

    simulateRequest() {
      const methods = ['GET', 'POST', 'PUT', 'DELETE']
      const paths = ['/api/users', '/api/posts', '/api/comments', '/api/auth']
      const statusCodes = [200, 201, 400, 404, 500]
      
      const log = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        method: methods[Math.floor(Math.random() * methods.length)],
        path: paths[Math.floor(Math.random() * paths.length)],
        statusCode: statusCodes[Math.floor(Math.random() * statusCodes.length)],
        responseTime: Math.floor(Math.random() * 1000) + 50,
        ip: '127.0.0.1',
        requestHeaders: {
          'Content-Type': 'application/json',
          'User-Agent': 'MockClient/1.0'
        },
        requestBody: null,
        responseHeaders: {
          'Content-Type': 'application/json',
          'X-Mock-Server': 'true'
        },
        responseBody: JSON.stringify({ message: 'Mock response' })
      }
      
      this.addRequestLog(log)
      
      // 更新路由命中统计
      const route = this.routes.find(r => 
        r.method === log.method && r.path === log.path && r.enabled
      )
      if (route) {
        route.hitCount = (route.hitCount || 0) + 1
        route.lastHit = log.timestamp
      }
    },

    addRequestLog(log: any) {
      this.requestLogs.push(log)
      
      // 限制日志数量
      if (this.requestLogs.length > this.settings.maxLogs) {
        this.requestLogs = this.requestLogs.slice(-this.settings.maxLogs)
      }
    },

    async clearLogs() {
      this.requestLogs = []
    },

    // Settings management
    async updateSettings(settings: Partial<MockServerSettings>) {
      this.settings = { ...this.settings, ...settings }
      await this.saveSettings()
    },

    // Import/Export
    async importRoutes(routes: MockRoute[]) {
      // 验证路由格式
      const validRoutes = routes.filter(route => 
        route.method && route.path && route.response
      )
      
      // 生成新的ID
      const newRoutes = validRoutes.map(route => ({
        ...route,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        hitCount: 0,
        lastHit: undefined
      }))
      
      this.routes.push(...newRoutes)
      await this.saveRoutes()
      
      return newRoutes.length
    },

    async exportRoutes() {
      return JSON.stringify(this.routes, null, 2)
    },

    // Route matching
    matchRoute(method: string, path: string, query: any, headers: any, body: any) {
      const routes = this.routes.filter(route => 
        route.enabled && 
        route.method === method && 
        this.pathMatches(route.path, path)
      )
      
      // 按条件匹配度排序
      const scoredRoutes = routes.map(route => ({
        route,
        score: this.calculateMatchScore(route, query, headers, body)
      }))
      
      scoredRoutes.sort((a, b) => b.score - a.score)
      
      return scoredRoutes[0]?.route
    },

    pathMatches(routePath: string, requestPath: string): boolean {
      // 简单的路径匹配，支持参数
      const routeSegments = routePath.split('/')
      const requestSegments = requestPath.split('/')
      
      if (routeSegments.length !== requestSegments.length) {
        return false
      }
      
      return routeSegments.every((segment, index) => {
        return segment.startsWith(':') || segment === requestSegments[index]
      })
    },

    calculateMatchScore(route: MockRoute, query: any, headers: any, body: any): number {
      let score = 0
      
      if (!route.conditions || route.conditions.length === 0) {
        return 1 // 基础匹配分数
      }
      
      for (const condition of route.conditions) {
        if (this.conditionMatches(condition, query, headers, body)) {
          score += 10
        } else {
          return 0 // 条件不匹配，分数为0
        }
      }
      
      return score
    },

    conditionMatches(condition: MockCondition, query: any, headers: any, body: any): boolean {
      let value: string
      
      switch (condition.type) {
        case 'query':
          value = query[condition.key]
          break
        case 'header':
          value = headers[condition.key.toLowerCase()]
          break
        case 'body':
          value = typeof body === 'string' ? body : JSON.stringify(body)
          break
        default:
          return false
      }
      
      if (!value) return false
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'contains':
          return value.includes(condition.value)
        case 'regex':
          try {
            return new RegExp(condition.value).test(value)
          } catch {
            return false
          }
        default:
          return false
      }
    },

    // Generate mock response
    generateResponse(route: MockRoute, params: any = {}) {
      let body = route.response.body
      
      // 替换路径参数
      if (typeof body === 'string' && params) {
        Object.keys(params).forEach(key => {
          body = body.replace(new RegExp(`{{${key}}}`, 'g'), params[key])
        })
      }
      
      return {
        statusCode: route.response.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Server': 'true',
          ...Object.fromEntries(
            route.response.headers?.map(h => [h.key, h.value]) || []
          )
        },
        body,
        delay: route.delay || 0
      }
    },

    // Persistence
    async saveRoutes() {
      localStorage.setItem('mock-routes', JSON.stringify(this.routes))
    },

    async loadRoutes() {
      const saved = localStorage.getItem('mock-routes')
      if (saved) {
        try {
          this.routes = JSON.parse(saved)
        } catch (error) {
          console.error('Failed to load routes:', error)
        }
      }
    },

    async saveSettings() {
      localStorage.setItem('mock-settings', JSON.stringify(this.settings))
    },

    async loadSettings() {
      const saved = localStorage.getItem('mock-settings')
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) }
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
    }
  }
})