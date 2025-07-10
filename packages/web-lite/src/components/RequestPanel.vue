<template>
  <el-card class="request-panel">
    <template #header>
      <div class="panel-header">
        <span>请求配置</span>
      </div>
    </template>
    
    <el-form :model="request" label-width="80px">
      <el-form-item label="请求方法">
        <el-select v-model="request.method" style="width: 120px">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="请求URL">
        <el-input 
          v-model="request.url" 
          placeholder="请输入接口地址"
          @keyup.enter="sendRequest"
        >
          <template #append>
            <el-button 
              type="primary" 
              @click="sendRequest"
              :loading="loading"
            >
              发送
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      
      <el-form-item label="请求头">
        <div class="headers-container">
          <div 
            v-for="(header, index) in headers" 
            :key="index"
            class="header-row"
          >
            <el-input 
              v-model="header.key" 
              placeholder="Header名称"
              style="margin-right: 8px"
            />
            <el-input 
              v-model="header.value" 
              placeholder="Header值"
              style="margin-right: 8px"
            />
            <el-button 
              type="danger" 
              size="small"
              @click="removeHeader(index)"
            >
              删除
            </el-button>
          </div>
          <el-button @click="addHeader" size="small">添加Header</el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="请求体" v-if="['POST', 'PUT', 'PATCH'].includes(request.method)">
        <el-input 
          v-model="request.data"
          type="textarea"
          :rows="8"
          placeholder="请输入JSON格式的请求体"
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRequestStore } from '../stores/request'
import type { RequestConfig } from '@api-debug-tool/shared/types'

const requestStore = useRequestStore()
const loading = ref(false)

const request = ref<RequestConfig>({
  url: '',
  method: 'GET',
  data: ''
})

const headers = ref<Array<{key: string, value: string}>>([
  { key: '', value: '' }
])

const addHeader = () => {
  headers.value.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  headers.value.splice(index, 1)
}

const sendRequest = async () => {
  if (!request.value.url) {
    return
  }
  
  loading.value = true
  
  // 构建请求头
  const requestHeaders: Record<string, string> = {}
  headers.value.forEach(header => {
    if (header.key && header.value) {
      requestHeaders[header.key] = header.value
    }
  })
  
  const requestConfig: RequestConfig = {
    ...request.value,
    headers: requestHeaders
  }
  
  try {
    await requestStore.sendRequest(requestConfig)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.request-panel {
  height: 100%;
  
  .panel-header {
    font-weight: 600;
  }
  
  .headers-container {
    width: 100%;
    
    .header-row {
      display: flex;
      margin-bottom: 8px;
      align-items: center;
    }
  }
}
</style>