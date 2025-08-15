import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TestSuite, 
  TestResult, 
  Schedule,
  RunHistoryData 
} from '@/types'

export const useAutomationStore = defineStore('automation', () => {
  // 状态
  const suites = ref<TestSuite[]>([])
  const testResults = ref<TestResult[]>([])
  const schedules = ref<Schedule[]>([])
  const settings = ref({
    maxConcurrentTests: 5,
    timeout: 30000,
    retryCount: 3,
    reportFormat: 'html',
    notifications: {
      onSuccess: true,
      onFailure: true,
      onScheduled: false
    }
  })
  const loading = ref(false)
  const runningTests = ref<string[]>([])

  // 计算属性
  const activeSuites = computed(() => 
    suites.value.filter(suite => suite.enabled)
  )

  const totalTests = computed(() => 
    suites.value.reduce((total, suite) => total + (suite.tests?.length || 0), 0)
  )

  const successRate = computed(() => {
    const total = testResults.value.length
    if (total === 0) return 0
    const passed = testResults.value.filter(result => result.status === 'passed').length
    return Math.round((passed / total) * 100)
  })

  const summary = computed(() => ({
    totalSuites: suites.value.length,
    activeSuites: activeSuites.value.length,
    totalTests: totalTests.value,
    successRate: successRate.value,
    lastRun: testResults.value.length > 0 
      ? Math.max(...testResults.value.map(r => r.timestamp))
      : null
  }))

  const historyData = computed((): RunHistoryData[] => {
    // 按日期分组统计测试结果
    const grouped = testResults.value.reduce((acc, result) => {
      const date = new Date(result.timestamp).toDateString()
      if (!acc[date]) {
        acc[date] = { success: 0, failed: 0, total: 0 }
      }
      acc[date].total++
      if (result.status === 'passed') {
        acc[date].success++
      } else {
        acc[date].failed++
      }
      return acc
    }, {} as Record<string, { success: number; failed: number; total: number }>)

    return Object.entries(grouped).map(([date, stats]): RunHistoryData => ({
      date,
      success: stats.success,
      failed: stats.failed,
      total: stats.total
    }))
  })

  // 方法
  const loadSuites = async () => {
    loading.value = true
    try {
      // 模拟加载数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      suites.value = [
        {
          id: '1',
          name: 'API基础测试套件',
          environment: 'development',
          baseUrl: 'https://api.example.com',
          status: 'active' as const,
          description: '测试基础API功能',
          enabled: true,
          tests: [
            {
              id: '1-1',
              name: '用户登录测试',
              description: '测试用户登录功能',
              method: 'POST',
              url: '/api/auth/login',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: 'test', password: 'test123' }),
              assertions: [
                { id: '1', type: 'status', operator: 'equals', expected: 200 },
                { id: '2', type: 'body', operator: 'not_equals', expected: null }
              ],
              enabled: true,
              timeout: 5000,
              order: 1
            },
            {
              id: '1-2',
              name: '获取用户信息',
              description: '获取当前用户信息',
              method: 'GET',
              url: '/api/user/profile',
              headers: { 'Authorization': 'Bearer {{token}}' },
              assertions: [
                { id: '3', type: 'status', operator: 'equals', expected: 200 },
                { id: '4', type: 'body', operator: 'not_equals', expected: null }
              ],
              enabled: true,
              timeout: 3000,
              order: 2
            }
          ],
          config: {
            timeout: 30000,
            retryCount: 0,
            concurrency: 1,
            stopOnFailure: false,
            generateReport: true,
            enableScreenshot: false,
            enableLogging: true
          },
          notifications: {
            email: { enabled: false, recipients: [] },
            webhook: { enabled: false, url: '' },
            slack: { enabled: false }
          },
          lastRun: Date.now() - 3600000,
          createdBy: 'system',
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 3600000
        },
        {
          id: '2',
          name: '性能压力测试',
          environment: 'production',
          baseUrl: 'https://api.example.com',
          status: 'active' as const,
          description: '测试系统在高负载下的表现',
          enabled: false,
          tests: [
            {
              id: '2-1',
              name: '并发用户测试',
              description: '测试并发访问性能',
              method: 'GET',
              url: '/api/data/list',
              headers: {},
              assertions: [
                { id: '5', type: 'status', operator: 'equals', expected: 200 },
                { id: '6', type: 'response_time', operator: 'less_than', expected: 1000 }
              ],
              enabled: true,
              timeout: 10000,
              order: 1
            }
          ],
          config: {
            timeout: 30000,
            retryCount: 2,
            concurrency: 5,
            stopOnFailure: false,
            generateReport: true,
            enableScreenshot: false,
            enableLogging: true
          },
          notifications: {
            email: { enabled: false, recipients: [] },
            webhook: { enabled: false, url: '' },
            slack: { enabled: false }
          },
        lastRun: null,
        createdBy: 'system',
        createdAt: Date.now() - 172800000,
        updatedAt: Date.now() - 86400000
        }
      ]
    } finally {
      loading.value = false
    }
  }

  const createSuite = async (suiteData: Partial<TestSuite>) => {
    const newSuite: TestSuite = {
      id: Date.now().toString(),
      name: suiteData.name || '',
      description: suiteData.description || '',
      environment: suiteData.environment || 'development',
      baseUrl: suiteData.baseUrl || '',
      status: 'active',
      enabled: true,
      tests: [],
      config: {
        timeout: 30000,
        retryCount: 0,
        concurrency: 1,
        stopOnFailure: false,
        generateReport: true,
        enableScreenshot: false,
        enableLogging: true
      },
      notifications: {
        email: { enabled: false, recipients: [] },
        webhook: { enabled: false, url: '' },
        slack: { enabled: false }
      },
      createdBy: 'system',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    suites.value.push(newSuite)
    return newSuite
  }

  const updateSuite = async (id: string, updates: Partial<TestSuite>) => {
    const index = suites.value.findIndex(suite => suite.id === id)
    if (index !== -1) {
      suites.value[index] = {
        ...suites.value[index],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  const deleteSuite = async (id: string) => {
    const index = suites.value.findIndex(suite => suite.id === id)
    if (index !== -1) {
      suites.value.splice(index, 1)
    }
  }

  const runSuite = async (suite: TestSuite) => {
    if (runningTests.value.includes(suite.id)) return
    
    runningTests.value.push(suite.id)
    
    try {
      // 模拟运行测试
      for (const test of suite.tests || []) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const result: TestResult = {
          id: Date.now().toString(),
          testId: test.id,
          testName: test.name,
          suiteId: suite.id,
          status: Math.random() > 0.2 ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 2000) + 500,
          timestamp: Date.now(),
          environment: suite.environment,
          executor: 'system',
          request: {
            method: test.method,
            url: test.url,
            headers: test.headers,
            body: test.body
          },
          response: {
            status: 200,
            time: Math.floor(Math.random() * 1000) + 100,
            headers: {},
            body: '{ "success": true }'
          },
          assertions: test.assertions.map(assertion => ({
            id: assertion.id,
            name: `${assertion.type} assertion`,
            passed: Math.random() > 0.1,
            expected: assertion.expected,
            actual: Math.random() > 0.5 ? assertion.expected : 'different_value',
            message: Math.random() > 0.1 ? undefined : 'Assertion failed'
          })),
          error: Math.random() > 0.8 ? 'Connection timeout' : undefined,
          logs: [{
            timestamp: Date.now(),
            level: 'info' as const,
            message: `Test ${test.name} executed`
          }]
        }
        
        testResults.value.push(result)
      }
      
      // 更新套件最后运行时间
      await updateSuite(suite.id, { lastRun: Date.now() })
    } finally {
      const index = runningTests.value.indexOf(suite.id)
      if (index !== -1) {
        runningTests.value.splice(index, 1)
      }
    }
  }

  const runAllSuites = async () => {
    const enabled = activeSuites.value
    for (const suite of enabled) {
      await runSuite(suite)
    }
  }

  const getTestResults = (suiteId?: string) => {
    if (suiteId) {
      return testResults.value.filter(result => result.suiteId === suiteId)
    }
    return testResults.value
  }

  const clearResults = () => {
    testResults.value = []
  }

  const exportResults = async (format: 'json' | 'csv' | 'html' = 'json') => {
    const data = testResults.value
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'csv':
        const headers = ['Suite ID', 'Test ID', 'Status', 'Duration', 'Timestamp']
        const rows = data.map(result => [
          result.suiteId,
          result.testId,
          result.status,
          result.duration,
          new Date(result.timestamp).toISOString()
        ])
        return [headers, ...rows].map(row => row.join(',')).join('\n')
      case 'html':
        return `
          <html>
            <head><title>Test Results</title></head>
            <body>
              <h1>Automation Test Results</h1>
              <table border="1">
                <tr><th>Suite</th><th>Test</th><th>Status</th><th>Duration</th><th>Time</th></tr>
                ${data.map(result => `
                  <tr>
                    <td>${result.suiteId}</td>
                    <td>${result.testId}</td>
                    <td>${result.status}</td>
                    <td>${result.duration}ms</td>
                    <td>${new Date(result.timestamp).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </table>
            </body>
          </html>
        `
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  const updateSettings = (newSettings: any) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  const createSchedule = async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSchedule: Schedule = {
      ...schedule,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    schedules.value.push(newSchedule)
    return newSchedule
  }

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    const index = schedules.value.findIndex(schedule => schedule.id === id)
    if (index !== -1) {
      schedules.value[index] = { 
        ...schedules.value[index], 
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  const deleteSchedule = async (id: string) => {
    const index = schedules.value.findIndex(schedule => schedule.id === id)
    if (index !== -1) {
      schedules.value.splice(index, 1)
    }
  }

  return {
    // 状态
    suites,
    testResults,
    schedules,
    settings,
    loading,
    runningTests,
    
    // 计算属性
    activeSuites,
    totalTests,
    successRate,
    summary,
    historyData,
    
    // 方法
    loadSuites,
    createSuite,
    updateSuite,
    deleteSuite,
    runSuite,
    runAllSuites,
    getTestResults,
    clearResults,
    exportResults,
    updateSettings,
    createSchedule,
    updateSchedule,
    deleteSchedule
  }
})