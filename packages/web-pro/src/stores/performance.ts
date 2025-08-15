import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExtendedPerformanceMetrics, PerformanceSummary, PerformanceSettings } from '@/types'

interface ResponseTimeData {
  timestamp: string
  avgTime: number
  p95Time: number
  p99Time: number
}

interface RequestVolumeData {
  timestamp: string
  successCount: number
  errorCount: number
  totalCount: number
}

interface WaterfallData {
  name: string
  start: number
  duration: number
  type: 'dns' | 'connect' | 'request' | 'response' | 'processing'
}

interface ErrorData {
  type: string
  count: number
  percentage: number
}

interface LoadMetricsParams {
  startTime: Date
  endTime: Date
}

interface ExportReportParams {
  timeRange: [Date, Date]
  format: 'pdf' | 'excel' | 'csv'
}

export const usePerformanceStore = defineStore('performance', () => {
  // 状态
  const metrics = ref<ExtendedPerformanceMetrics[]>([])
  const loading = ref(false)
  const settings = ref<PerformanceSettings>({
    sampleRate: 1,
    retentionDays: 30,
    autoRefresh: true,
    refreshInterval: 30000,
    responseTimeAlert: true,
    responseTimeThreshold: 1000,
    errorRateAlert: true,
    errorRateThreshold: 5,
    defaultTimeRange: '1h',
    chartTheme: 'auto',
    visibleCharts: ['responseTime', 'requestVolume', 'errorRate'],
    exportFormat: ['json', 'csv'],
    includeCharts: true
  })

  // 计算属性
  const summary = computed((): PerformanceSummary => {
    if (metrics.value.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        errorRate: 0,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        duration: 0
      }
    }

    const totalRequests = metrics.value.length
    const successfulRequests = metrics.value.filter(m => m.status >= 200 && m.status < 400).length
    const avgDuration = metrics.value.reduce((sum, m) => sum + m.duration, 0) / totalRequests
    const successRate = (successfulRequests / totalRequests) * 100
    const errorRate = 100 - successRate

    // 计算吞吐量 (每分钟请求数)
    const timeSpan = metrics.value.length > 0 ? 
      (new Date(metrics.value[metrics.value.length - 1].timestamp).getTime() - 
       new Date(metrics.value[0].timestamp).getTime()) / (1000 * 60) : 1
    const throughput = totalRequests / Math.max(timeSpan, 1)

    const failedRequests = totalRequests - successfulRequests
    const durations = metrics.value.map(m => m.duration).sort((a, b) => a - b)
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0
    const minDuration = Math.min(...durations) || 0
    const maxDuration = Math.max(...durations) || 0
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgDuration),
      minResponseTime: Math.round(minDuration),
      maxResponseTime: Math.round(maxDuration),
      p50ResponseTime: Math.round(p50),
      p95ResponseTime: Math.round(p95),
      p99ResponseTime: Math.round(p99),
      throughput: Math.round(throughput * 100) / 100,
      duration: Math.round(avgDuration)
    }
  })

  const responseTimeData = computed((): ResponseTimeData[] => {
    // 按小时分组数据
    const hourlyData = new Map<string, ExtendedPerformanceMetrics[]>()
    
    metrics.value.forEach(metric => {
      const hour = new Date(metric.timestamp)
      hour.setMinutes(0, 0, 0)
      const key = hour.toISOString()
      
      if (!hourlyData.has(key)) {
        hourlyData.set(key, [])
      }
      hourlyData.get(key)!.push(metric)
    })

    return Array.from(hourlyData.entries()).map(([timestamp, data]) => {
      const durations = data.map(d => d.duration).sort((a, b) => a - b)
      const avgTime = durations.reduce((sum, d) => sum + d, 0) / durations.length
      const p95Time = durations[Math.floor(durations.length * 0.95)] || 0
      const p99Time = durations[Math.floor(durations.length * 0.99)] || 0

      return {
        timestamp,
        avgTime: Math.round(avgTime),
        p95Time: Math.round(p95Time),
        p99Time: Math.round(p99Time)
      }
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  })

  const requestVolumeData = computed((): RequestVolumeData[] => {
    // 按小时分组数据
    const hourlyData = new Map<string, ExtendedPerformanceMetrics[]>()
    
    metrics.value.forEach(metric => {
      const hour = new Date(metric.timestamp)
      hour.setMinutes(0, 0, 0)
      const key = hour.toISOString()
      
      if (!hourlyData.has(key)) {
        hourlyData.set(key, [])
      }
      hourlyData.get(key)!.push(metric)
    })

    return Array.from(hourlyData.entries()).map(([timestamp, data]) => {
      const successCount = data.filter(d => d.status >= 200 && d.status < 400).length
      const errorCount = data.length - successCount
      const totalCount = data.length

      return {
        timestamp,
        successCount,
        errorCount,
        totalCount
      }
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  })

  const waterfallData = computed((): WaterfallData[] => {
    // 生成模拟瀑布图数据
    return metrics.value.slice(0, 10).map((metric) => {
      const phases = [
        { type: 'dns' as const, duration: Math.random() * 50 + 10 },
        { type: 'connect' as const, duration: Math.random() * 100 + 50 },
        { type: 'request' as const, duration: Math.random() * 200 + 100 },
        { type: 'response' as const, duration: Math.random() * 300 + 200 },
        { type: 'processing' as const, duration: Math.random() * 150 + 50 }
      ]

      let currentStart = 0
      return phases.map(phase => {
        const result = {
          name: `${metric.method} ${metric.url}`,
          start: currentStart,
          duration: Math.round(phase.duration),
          type: phase.type
        }
        currentStart += phase.duration
        return result
      })
    }).flat()
  })

  const errorData = computed((): ErrorData[] => {
    const errorCounts = new Map<string, number>()
    const totalErrors = metrics.value.filter(m => m.status >= 400).length

    if (totalErrors === 0) return []

    metrics.value.forEach(metric => {
      if (metric.status >= 400) {
        const errorType = getErrorType(metric.status)
        errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1)
      }
    })

    return Array.from(errorCounts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalErrors) * 10000) / 100
    }))
  })

  // 方法
  const loadMetrics = async (params: LoadMetricsParams) => {
    loading.value = true
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 生成模拟数据
      const mockData: ExtendedPerformanceMetrics[] = []
      const startTime = params.startTime.getTime()
      const endTime = params.endTime.getTime()
      const interval = (endTime - startTime) / 100 // 生成100个数据点

      for (let i = 0; i < 100; i++) {
        const timestamp = new Date(startTime + i * interval)
        const duration = Math.random() * 2000 + 100
        const startTimeMs = timestamp.getTime()
        const endTimeMs = startTimeMs + duration
        
        mockData.push({
          id: `metric-${i}`,
          requestId: `req-${i}`,
          timestamp: timestamp.toISOString(),
          url: `/api/endpoint-${Math.floor(Math.random() * 10)}`,
          method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
          startTime: startTimeMs,
          endTime: endTimeMs,
          duration: Math.round(duration),
          dnsLookup: Math.round(Math.random() * 50 + 10),
          tcpConnect: Math.round(Math.random() * 100 + 50),
          tlsHandshake: Math.round(Math.random() * 80 + 20),
          firstByte: Math.round(Math.random() * 200 + 100),
          contentDownload: Math.round(Math.random() * 300 + 200),
          totalSize: Math.round(Math.random() * 10000 + 1000),
          transferSize: Math.round(Math.random() * 8000 + 800),
          resourceSize: Math.round(Math.random() * 12000 + 1200),
          status: Math.random() > 0.1 ? 200 : [400, 404, 500][Math.floor(Math.random() * 3)],
          size: Math.round(Math.random() * 10000 + 1000),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
      }

      metrics.value = mockData
    } finally {
      loading.value = false
    }
  }

  const exportReport = async (params: ExportReportParams) => {
    // 模拟导出报告
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const data = {
      summary: summary.value,
      metrics: metrics.value,
      timeRange: params.timeRange,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  const updateSettings = (newSettings: Partial<PerformanceSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  const getErrorType = (status: number): string => {
    if (status >= 400 && status < 500) {
      switch (status) {
        case 400: return '400 Bad Request'
        case 401: return '401 Unauthorized'
        case 403: return '403 Forbidden'
        case 404: return '404 Not Found'
        case 429: return '429 Too Many Requests'
        default: return '4xx Client Error'
      }
    } else if (status >= 500) {
      switch (status) {
        case 500: return '500 Internal Server Error'
        case 502: return '502 Bad Gateway'
        case 503: return '503 Service Unavailable'
        case 504: return '504 Gateway Timeout'
        default: return '5xx Server Error'
      }
    }
    return 'Unknown Error'
  }

  return {
    // 状态
    metrics,
    loading,
    settings,
    
    // 计算属性
    summary,
    responseTimeData,
    requestVolumeData,
    waterfallData,
    errorData,
    
    // 方法
    loadMetrics,
    exportReport,
    updateSettings
  }
})