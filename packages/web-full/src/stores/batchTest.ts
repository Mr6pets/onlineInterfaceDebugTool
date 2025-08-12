import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type {
  BatchTest as TestSuite,
  BatchTestResult,
  RequestConfig,
  HttpMethod
} from '@shared/types'

// 本地特定类型定义
interface TestRequest {
  id: string
  name: string
  method: string
  url: string
  headers?: Record<string, string>
  body?: any
  tests?: string[]
  status?: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  responseTime?: number
  response?: any
  error?: string
}

interface TestSettings {
  concurrency: number
  delay: number
  timeout: number
  retries: number
  environmentId: string
  variables: Array<{ key: string; value: string }>
  stopOnFailure: boolean
  followRedirects: boolean
  validateSSL: boolean
}

// AssertionResult 接口暂时未使用，已注释
// interface AssertionResult {
//   name: string
//   passed: boolean
//   message?: string
//   error?: string
// }

interface TestSummary {
  totalRequests: number
  passedRequests: number
  failedRequests: number
  skippedRequests: number
  totalTime: number
  averageResponseTime: number
  successRate: number
}

// 本地测试结果类型，包含套件相关信息
interface TestResult {
  id: string
  suiteId: string
  suiteName: string
  status: 'running' | 'passed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  totalCount: number
  passedCount: number
  failedCount: number
  skippedCount: number
  results: BatchTestResult[]
  summary?: TestSummary
}

// 简单的存储工具
const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  }
}

export const useBatchTestStore = defineStore('batchTest', () => {
  // 状态
  const testSuites = ref<TestSuite[]>([])
  const testResults = ref<TestResult[]>([])
  const currentSuite = ref<TestSuite | null>(null)
  const runningTests = ref<string[]>([])
  const loading = ref(false)

  // 计算属性
  const activeSuites = computed(() => 
    testSuites.value // BatchTest 类型没有 status 属性，返回所有套件
  )

  const recentResults = computed(() => 
    testResults.value
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10)
  )

  const isRunning = computed(() => (suiteId: string) => 
    runningTests.value.includes(suiteId)
  )

  // 基础数据操作
  const loadTestSuites = async () => {
    loading.value = true
    try {
      const savedSuites = await storage.get('testSuites') || []
      testSuites.value = savedSuites.map((suite: any) => ({
        ...suite,
        createdAt: new Date(suite.createdAt),
        updatedAt: new Date(suite.updatedAt),
        lastRunAt: suite.lastRunAt ? new Date(suite.lastRunAt) : undefined
      }))
    } catch (error) {
      console.error('Failed to load test suites:', error)
      ElMessage.error('加载测试套件失败')
    } finally {
      loading.value = false
    }
  }

  const loadTestResults = async () => {
    try {
      const savedResults = await storage.get('testResults') || []
      testResults.value = savedResults.map((result: any) => ({
        ...result,
        startTime: new Date(result.startTime),
        endTime: result.endTime ? new Date(result.endTime) : undefined
      }))
    } catch (error) {
      console.error('Failed to load test results:', error)
    }
  }

  const saveTestSuites = async () => {
    try {
      await storage.set('testSuites', testSuites.value)
    } catch (error) {
      console.error('Failed to save test suites:', error)
    }
  }

  const saveTestResults = async () => {
    try {
      await storage.set('testResults', testResults.value)
    } catch (error) {
      console.error('Failed to save test results:', error)
    }
  }

  // 测试套件管理
  const createTestSuite = async (suiteData: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      const newSuite: TestSuite = {
        ...suiteData,
        id: `suite-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      testSuites.value.push(newSuite)
      await saveTestSuites()

      ElMessage.success('测试套件创建成功')
      return newSuite
    } catch (error) {
      console.error('Failed to create test suite:', error)
      ElMessage.error('创建测试套件失败')
      throw error
    }
  }

  const updateTestSuite = async (suiteId: string, updates: Partial<TestSuite>) => {
    try {
      const suiteIndex = testSuites.value.findIndex(suite => suite.id === suiteId)
      if (suiteIndex === -1) {
        throw new Error('Test suite not found')
      }

      testSuites.value[suiteIndex] = {
        ...testSuites.value[suiteIndex],
        ...updates,
        updatedAt: new Date()
      }

      await saveTestSuites()
      ElMessage.success('测试套件更新成功')
    } catch (error) {
      console.error('Failed to update test suite:', error)
      ElMessage.error('更新测试套件失败')
    }
  }

  const deleteTestSuite = async (suiteId: string) => {
    try {
      const suiteIndex = testSuites.value.findIndex(suite => suite.id === suiteId)
      if (suiteIndex === -1) {
        throw new Error('Test suite not found')
      }

      testSuites.value.splice(suiteIndex, 1)
      await saveTestSuites()

      // 同时删除相关的测试结果
      testResults.value = testResults.value.filter(result => result.suiteId !== suiteId)
      await saveTestResults()

      ElMessage.success('测试套件删除成功')
    } catch (error) {
      console.error('Failed to delete test suite:', error)
      ElMessage.error('删除测试套件失败')
    }
  }

  const duplicateTestSuite = async (suiteId: string) => {
    try {
      const originalSuite = testSuites.value.find(suite => suite.id === suiteId)
      if (!originalSuite) {
        throw new Error('Test suite not found')
      }

      const duplicatedSuite: TestSuite = {
        ...originalSuite,
        id: `suite-${Date.now()}`,
        name: `${originalSuite.name} (副本)`,
        // BatchTest 类型没有 status, createdAt, updatedAt, lastRunAt, successRate 属性
      }

      testSuites.value.push(duplicatedSuite)
      await saveTestSuites()

      ElMessage.success('测试套件复制成功')
      return duplicatedSuite
    } catch (error) {
      console.error('Failed to duplicate test suite:', error)
      ElMessage.error('复制测试套件失败')
      throw error
    }
  }

  // 测试执行
  const runTestSuite = async (suiteId: string) => {
    try {
      const suite = testSuites.value.find(s => s.id === suiteId)
      if (!suite) {
        throw new Error('Test suite not found')
      }

      if (runningTests.value.includes(suiteId)) {
        ElMessage.warning('测试套件正在运行中')
        return
      }

      runningTests.value.push(suiteId)
      
      // 更新套件状态
      // BatchTest 类型没有 status 属性，移除状态更新

      // 创建测试结果记录
      const testResult: TestResult = {
        id: `result-${Date.now()}`,
        suiteId,
        suiteName: suite.name,
        status: 'running',
        startTime: new Date(),
        totalCount: suite.requests.length,
        passedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        results: []
      }

      testResults.value.unshift(testResult)
      // 记录测试结果与套件的映射关系
      // 保存测试结果
      await saveTestResults()

      // 执行测试请求
      const results = await executeTestRequests(suite)
      
      // 计算测试结果
      const passedCount = results.filter(r => r.success).length
      const failedCount = results.filter(r => !r.success).length
      const skippedCount = 0
      const totalTime = results.reduce((sum, r) => sum + r.duration, 0)
      const averageResponseTime = totalTime / results.length || 0
      const successRate = (passedCount / results.length) * 100

      // 更新测试结果
      const resultIndex = testResults.value.findIndex(r => r.id === testResult.id)
      if (resultIndex !== -1) {
        testResults.value[resultIndex] = {
          ...testResults.value[resultIndex],
          status: failedCount > 0 ? 'failed' : 'passed',
          endTime: new Date(),
          duration: Date.now() - testResult.startTime.getTime(),
          passedCount,
          failedCount,
          skippedCount,
          results,
          summary: {
            totalRequests: results.length,
            passedRequests: passedCount,
            failedRequests: failedCount,
            skippedRequests: skippedCount,
            totalTime,
            averageResponseTime,
            successRate
          }
        }
      }

      // 更新套件状态
      // BatchTest 类型没有 lastRunAt 属性，移除更新

      await saveTestResults()
      
      ElMessage.success(`测试执行完成，通过 ${passedCount}/${results.length} 个请求`)
      return testResults.value[resultIndex]
    } catch (error) {
      console.error('Failed to run test suite:', error)
      ElMessage.error('测试执行失败')
      
      // 更新套件状态为失败
      // BatchTest 类型没有 status 属性，移除状态更新
      throw error
    } finally {
      runningTests.value = runningTests.value.filter(id => id !== suiteId)
    }
  }

  const stopTestSuite = async (suiteId: string) => {
    try {
      runningTests.value = runningTests.value.filter(id => id !== suiteId)
      // BatchTest 类型没有 status 属性，移除状态更新
      
      // 更新正在运行的测试结果状态
      const runningResult = testResults.value.find(
        result => result.suiteId === suiteId && result.status === 'running'
      )
      if (runningResult) {
        runningResult.status = 'cancelled'
        runningResult.endTime = new Date()
        runningResult.duration = Date.now() - runningResult.startTime.getTime()
        await saveTestResults()
      }
      
      ElMessage.success('测试已停止')
    } catch (error) {
      console.error('Failed to stop test suite:', error)
      ElMessage.error('停止测试失败')
    }
  }

  // 模拟测试请求执行
  const executeTestRequests = async (suite: TestSuite): Promise<BatchTestResult[]> => {
    const results: BatchTestResult[] = []
    
    // 使用默认设置，因为 BatchTest 类型没有 settings 属性
     const defaultSettings: TestSettings = {
       concurrency: 1,
       delay: 0,
       timeout: 30000,
       retries: 0,
       environmentId: '',
       variables: [],
       stopOnFailure: false,
       followRedirects: true,
       validateSSL: true
     }
    
    const { concurrency, delay } = defaultSettings

    // 简单的并发控制
    const chunks = []
    for (let i = 0; i < suite.requests.length; i += concurrency) {
      chunks.push(suite.requests.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
          chunk.map((request: RequestConfig, index: number) => {
            const testRequest: TestRequest = {
              id: `request-${Date.now()}-${index}`,
              name: `Request ${index + 1}`,
              method: request.method,
              url: request.url,
              headers: request.headers,
              body: request.data,
              ...defaultSettings
            }
            return executeTestRequest(testRequest, defaultSettings)
          })
        )
      results.push(...chunkResults)
      
      // 请求间延迟
      if (delay > 0 && chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return results
  }

  // 模拟单个请求执行
  const executeTestRequest = async (
    request: TestRequest, 
    settings: TestSettings
  ): Promise<BatchTestResult> => {
    const startTime = Date.now()
    
    try {
      // 模拟网络请求
      await new Promise(resolve => {
        const responseTime = Math.random() * 1000 + 100 // 100-1100ms
        setTimeout(resolve, Math.min(responseTime, settings.timeout))
      })
      
      const responseTime = Date.now() - startTime
      const success = Math.random() > 0.1 // 90% 成功率
      
      return {
        requestId: request.id,
        request: {
           url: request.url,
           method: request.method as keyof HttpMethod,
           headers: request.headers || {},
           data: request.body
         },
        response: {
          status: success ? 200 : 500,
          statusText: success ? 'OK' : 'Internal Server Error',
          headers: {},
          data: success ? { message: 'Success' } : { error: 'Server Error' },
          duration: responseTime,
          size: success ? JSON.stringify({ message: 'Success' }).length : JSON.stringify({ error: 'Server Error' }).length
        },
        tests: [],
        duration: responseTime,
        success: success,
        error: success ? undefined : 'HTTP 500: Internal Server Error'
      }
    } catch (error) {
      return {
        requestId: request.id,
        request: {
           url: request.url,
           method: request.method as keyof HttpMethod,
           headers: request.headers || {},
           data: request.body
         },
        response: {
          status: 0,
          statusText: 'Network Error',
          headers: {},
          data: null,
          duration: Date.now() - startTime,
          size: 0
        },
        tests: [],
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 数据导入导出
  const exportTestSuite = async (suiteId: string) => {
    try {
      const suite = testSuites.value.find(s => s.id === suiteId)
      if (!suite) {
        throw new Error('Test suite not found')
      }

      const exportData = {
        suite,
        results: testResults.value.filter(r => r.suiteId === suiteId),
        exportedAt: new Date(),
        version: '1.0'
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${suite.name}-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      ElMessage.success('测试套件导出成功')
    } catch (error) {
      console.error('Failed to export test suite:', error)
      ElMessage.error('导出测试套件失败')
    }
  }

  const importTestSuite = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.suite) {
        throw new Error('Invalid test suite file')
      }

      const importedSuite: TestSuite = {
        ...data.suite,
        id: `suite-${Date.now()}`,
        name: `${data.suite.name} (导入)`,
        status: 'idle',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: undefined,
        successRate: undefined
      }

      testSuites.value.push(importedSuite)
      await saveTestSuites()

      ElMessage.success('测试套件导入成功')
      return importedSuite
    } catch (error) {
      console.error('Failed to import test suite:', error)
      ElMessage.error('导入测试套件失败')
      throw error
    }
  }

  // 清理数据
  const clearTestResults = async (suiteId?: string) => {
    try {
      if (suiteId) {
        testResults.value = testResults.value.filter(result => result.suiteId !== suiteId)
      } else {
        testResults.value = []
        // 清空所有测试结果
      }
      await saveTestResults()
      ElMessage.success('测试结果已清空')
    } catch (error) {
      console.error('Failed to clear test results:', error)
      ElMessage.error('清空测试结果失败')
    }
  }

  return {
    // 状态
    testSuites,
    testResults,
    currentSuite,
    runningTests,
    loading,
    
    // 计算属性
    activeSuites,
    recentResults,
    isRunning,
    
    // 方法
    loadTestSuites,
    loadTestResults,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    duplicateTestSuite,
    runTestSuite,
    stopTestSuite,
    exportTestSuite,
    importTestSuite,
    clearTestResults
  }
})