import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RequestConfig, ResponseData } from '@api-debug-tool/shared/types'

export const useRequestStore = defineStore('request', () => {
  const currentRequest = ref<RequestConfig | null>(null)
  const response = ref<ResponseData | null>(null)
  const loading = ref(false)
  const history = ref<Array<{request: RequestConfig, response?: ResponseData}>>([])

  const sendRequest = async (config: RequestConfig) => {
    loading.value = true
    currentRequest.value = config
    
    try {
      const startTime = Date.now()
      const url = config.url
      
      const requestInit: RequestInit = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      }

      if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
        requestInit.body = typeof config.data === 'string' 
          ? config.data 
          : JSON.stringify(config.data)
      }

      const fetchResponse = await fetch(url, requestInit)
      const duration = Date.now() - startTime
      const responseText = await fetchResponse.text()
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      const result: ResponseData = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        data: responseData,
        duration,
        size: new Blob([responseText]).size
      }
      
      response.value = result
      
      // 添加到历史记录
      history.value.unshift({
        request: config,
        response: result
      })
      
      // 限制历史记录数量
      if (history.value.length > 50) {
        history.value = history.value.slice(0, 50)
      }
      
    } catch (error) {
      console.error('Request failed:', error)
      response.value = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
        size: 0
      }
    } finally {
      loading.value = false
    }
  }

  const clearRequest = () => {
    currentRequest.value = null
  }

  const clearResponse = () => {
    response.value = null
  }

  const clearHistory = () => {
    history.value = []
  }

  return {
    currentRequest,
    response,
    loading,
    history,
    sendRequest,
    clearRequest,
    clearResponse,
    clearHistory
  }
})