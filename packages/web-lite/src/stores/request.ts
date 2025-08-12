import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RequestConfig, ResponseData } from '@/types'
import { useHistoryStore } from './history'
import { useEnvironmentStore } from './environment'

export const useRequestStore = defineStore('request', () => {
  const currentRequest = ref<RequestConfig>({
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    timeout: 30000,
    followRedirects: true,
    verifySsl: true,
    auth: {
      type: 'bearer',
      token: '',
      username: '',
      password: '',
      key: '',
      value: '',
      in: 'header'
    },
    body: {
      type: 'json',
      raw: '',
      formData: []
    }
  })
  
  const response = ref<ResponseData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const historyStore = useHistoryStore()
  const environmentStore = useEnvironmentStore()
  
  // 计算属性：解析环境变量后的请求配置
  const resolvedRequest = computed(() => {
    const resolved = { ...currentRequest.value }
    
    // 解析URL中的环境变量
    resolved.url = environmentStore.resolveVariables(resolved.url)
    
    // 解析headers中的环境变量
    resolved.headers = resolved.headers.map(header => ({
      ...header,
      key: environmentStore.resolveVariables(header.key),
      value: environmentStore.resolveVariables(header.value)
    }))
    
    // 解析params中的环境变量
    resolved.params = resolved.params.map(param => ({
      ...param,
      key: environmentStore.resolveVariables(param.key),
      value: environmentStore.resolveVariables(param.value)
    }))
    
    return resolved
  })
  
  const sendRequest = async () => {
    loading.value = true
    error.value = null
    
    try {
      const startTime = Date.now()
      const config = resolvedRequest.value
      
      // 构建请求URL
      let url = config.url
      const enabledParams = config.params.filter(p => p.enabled && p.key)
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams()
        enabledParams.forEach(param => {
          searchParams.append(param.key, param.value)
        })
        url += (url.includes('?') ? '&' : '?') + searchParams.toString()
      }
      
      // 构建请求头
      const headers: Record<string, string> = {}
      config.headers.filter(h => h.enabled && h.key).forEach(header => {
        headers[header.key] = header.value
      })
      
      // 根据请求体类型设置Content-Type
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
        if (config.body.type === 'json') {
          headers['Content-Type'] = 'application/json'
        } else if (config.body.type === 'form') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded'
        }
      }
      
      // 构建请求选项
      const options: RequestInit = {
        method: config.method,
        headers,
        signal: AbortSignal.timeout(config.timeout || 30000)
      }
      
      // 处理认证
      if (config.auth && config.auth.type !== 'none') {
        switch (config.auth.type) {
          case 'bearer':
            if (config.auth.token) {
              headers['Authorization'] = `Bearer ${config.auth.token}`
            }
            break
          case 'basic':
            if (config.auth.username && config.auth.password) {
              const credentials = btoa(`${config.auth.username}:${config.auth.password}`)
              headers['Authorization'] = `Basic ${credentials}`
            }
            break
          case 'apikey':
            if (config.auth.key && config.auth.value) {
              if (config.auth.in === 'header') {
                headers[config.auth.key] = config.auth.value
              } else {
                // 添加到查询参数
                const separator = url.includes('?') ? '&' : '?'
                url += `${separator}${config.auth.key}=${encodeURIComponent(config.auth.value)}`
              }
            }
            break
        }
      }
      
      // 添加请求体
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
        if (config.body.type === 'json' && config.body.raw) {
          options.body = config.body.raw
        } else if (config.body.type === 'form' && config.body.formData) {
          const formData = new URLSearchParams()
          config.body.formData.filter(item => item.enabled && item.key).forEach(item => {
            formData.append(item.key, item.value)
          })
          options.body = formData.toString()
        }
      }
      
      const res = await fetch(url, options)
      const duration = Date.now() - startTime
      
      // 解析响应
      let responseData: any
      const contentType = res.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        try {
          responseData = await res.json()
        } catch {
          responseData = await res.text()
        }
      } else {
        responseData = await res.text()
      }
      
      // 解析cookies
      const cookies: Array<any> = []
      const setCookieHeader = res.headers.get('set-cookie')
      if (setCookieHeader) {
        // 简单的cookie解析
        setCookieHeader.split(',').forEach(cookie => {
          const [nameValue, ...attributes] = cookie.trim().split(';')
          const [name, value] = nameValue.split('=')
          if (name && value) {
            cookies.push({
              name: name.trim(),
              value: value.trim()
            })
          }
        })
      }
      
      const responseObj: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: responseData,
        duration,
        size: new Blob([JSON.stringify(responseData)]).size,
        cookies
      }
      
      response.value = responseObj
      
      // 添加到历史记录
      historyStore.addItem({
        id: Date.now().toString(),
        request: { ...config },
        response: responseObj,
        timestamp: Date.now()
      })
      
    } catch (err: any) {
      console.error('Request failed:', err)
      error.value = err.message
      response.value = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: err.message,
        duration: 0,
        size: 0
      }
    } finally {
      loading.value = false
    }
  }
  
  const clearRequest = () => {
    currentRequest.value = {
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      timeout: 30000,
      followRedirects: true,
      verifySsl: true,
      auth: {
        type: 'bearer',
        token: '',
        username: '',
        password: '',
        key: '',
        value: '',
        in: 'header'
      },
      body: {
        type: 'json',
        raw: '',
        formData: []
      }
    }
  }
  
  const clearResponse = () => {
    response.value = null
    error.value = null
  }
  
  const clearAll = () => {
    clearRequest()
    clearResponse()
  }
  
  const loadFromHistory = (historyItem: any) => {
    // 转换headers格式
    const headers = historyItem.request.headers ? 
      Object.entries(historyItem.request.headers).map(([key, value]) => ({
        key,
        value,
        enabled: true
      })) : []
    
    // 转换params格式
    const params = historyItem.request.params ? 
      Object.entries(historyItem.request.params).map(([key, value]) => ({
        key,
        value,
        enabled: true
      })) : []
    
    currentRequest.value = {
      method: historyItem.request.method,
      url: historyItem.request.url,
      headers,
      params,
      timeout: historyItem.request.timeout || 30000,
      followRedirects: historyItem.request.followRedirects ?? true,
      verifySsl: historyItem.request.verifySsl ?? true,
      auth: historyItem.request.auth || {
        type: 'bearer',
        token: '',
        username: '',
        password: '',
        key: '',
        value: '',
        in: 'header'
      },
      body: historyItem.request.body || {
        type: 'json',
        raw: '',
        formData: []
      }
    }
  }
  
  return {
    currentRequest,
    response,
    loading,
    error,
    resolvedRequest,
    sendRequest,
    clearRequest,
    clearResponse,
    clearAll,
    loadFromHistory
  }
})