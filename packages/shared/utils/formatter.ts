// 数据格式化工具
import dayjs from 'dayjs'

export class Formatter {
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  static formatTimestamp(timestamp: number | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs(timestamp).format(format)
  }

  static formatJson(obj: any, indent: number = 2): string {
    try {
      return JSON.stringify(obj, null, indent)
    } catch {
      return String(obj)
    }
  }

  static formatHeaders(headers: Record<string, string>): string {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  }

  static formatCurl(config: any): string {
    let curl = `curl -X ${config.method}`
    
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        curl += ` -H "${key}: ${value}"`
      })
    }
    
    if (config.data) {
      const data = typeof config.data === 'string' ? config.data : JSON.stringify(config.data)
      curl += ` -d '${data}'`
    }
    
    curl += ` "${config.url}"`
    
    return curl
  }
}