<template>
  <div class="doc-preview">
    <div class="preview-header">
      <div class="header-left">
        <h2>{{ documentation.title || '未命名文档' }}</h2>
        <div class="doc-meta">
          <el-tag size="small" :type="getStatusType(documentation.status)">{{ getStatusText(documentation.status) }}</el-tag>
          <span class="version">v{{ documentation.version || '1.0.0' }}</span>
          <span class="update-time">更新于 {{ formatDate(documentation.updatedAt) }}</span>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button @click="toggleTheme" size="small" text>
          <el-icon><Moon v-if="isDark" /><Sunny v-else /></el-icon>
          {{ isDark ? '浅色' : '深色' }}
        </el-button>
        <el-button @click="exportDoc" size="small" text>
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="shareDoc" size="small" text>
          <el-icon><Share /></el-icon>
          分享
        </el-button>
        <el-button @click="printDoc" size="small" text>
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
      </div>
    </div>
    
    <div class="preview-content" :class="{ 'dark-theme': isDark }" :style="themeStyles">
      <!-- 文档信息 -->
      <div class="doc-info" v-if="documentation.description">
        <div class="description" v-html="renderMarkdown(documentation.description)"></div>
        
        <div class="contact-info" v-if="documentation.contact">
          <h3>联系信息</h3>
          <div class="contact-item" v-if="documentation.contact.name">
            <strong>联系人：</strong>{{ documentation.contact.name }}
          </div>
          <div class="contact-item" v-if="documentation.contact.email">
            <strong>邮箱：</strong>
            <a :href="`mailto:${documentation.contact.email}`">{{ documentation.contact.email }}</a>
          </div>
          <div class="contact-item" v-if="documentation.contact.url">
            <strong>网站：</strong>
            <a :href="documentation.contact.url" target="_blank">{{ documentation.contact.url }}</a>
          </div>
        </div>
        
        <div class="license-info" v-if="documentation.license">
          <h3>许可证</h3>
          <div class="license-item">
            <strong>{{ documentation.license.name }}</strong>
            <a v-if="documentation.license.url" :href="documentation.license.url" target="_blank">查看详情</a>
          </div>
        </div>
      </div>
      
      <!-- API 分组 -->
      <div class="api-groups" v-if="documentation.groups && documentation.groups.length">
        <div
          v-for="group in documentation.groups"
          :key="group.id"
          class="api-group"
        >
          <h2 class="group-title">{{ group.name }}</h2>
          <p class="group-description" v-if="group.description">{{ group.description }}</p>
          
          <div class="api-list">
            <div
              v-for="api in group.children"
              :key="api.id"
              class="api-item"
            >
              <div class="api-header">
                <div class="api-method-path">
                  <el-tag
                    :type="getMethodType(api.method)"
                    size="small"
                    class="method-tag"
                  >
                    {{ api.method.toUpperCase() }}
                  </el-tag>
                  <code class="api-path">{{ api.path }}</code>
                </div>
                <h3 class="api-name">{{ api.name }}</h3>
              </div>
              
              <div class="api-description" v-if="api.description">
                <div v-html="renderMarkdown(api.description)"></div>
              </div>
              
              <!-- 请求参数 -->
              <div class="api-section" v-if="hasParameters(api)">
                <h4>请求参数</h4>
                
                <!-- 路径参数 -->
                <div v-if="api.parameters?.path?.length" class="param-group">
                  <h5>路径参数</h5>
                  <div class="param-table">
                    <div class="param-header">
                      <span>参数名</span>
                      <span>类型</span>
                      <span>必填</span>
                      <span>说明</span>
                    </div>
                    <div
                      v-for="param in api.parameters.path"
                      :key="param.name"
                      class="param-row"
                    >
                      <code>{{ param.name }}</code>
                      <span class="param-type">{{ param.type }}</span>
                      <el-tag :type="param.required ? 'danger' : 'info'" size="small">
                        {{ param.required ? '必填' : '可选' }}
                      </el-tag>
                      <span>{{ param.description || '-' }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 查询参数 -->
                <div v-if="api.parameters?.query?.length" class="param-group">
                  <h5>查询参数</h5>
                  <div class="param-table">
                    <div class="param-header">
                      <span>参数名</span>
                      <span>类型</span>
                      <span>必填</span>
                      <span>默认值</span>
                      <span>说明</span>
                    </div>
                    <div
                      v-for="param in api.parameters.query"
                      :key="param.name"
                      class="param-row"
                    >
                      <code>{{ param.name }}</code>
                      <span class="param-type">{{ param.type }}</span>
                      <el-tag :type="param.required ? 'danger' : 'info'" size="small">
                        {{ param.required ? '必填' : '可选' }}
                      </el-tag>
                      <code v-if="param.default">{{ param.default }}</code>
                      <span v-else>-</span>
                      <span>{{ param.description || '-' }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 请求头 -->
                <div v-if="api.parameters?.header?.length" class="param-group">
                  <h5>请求头</h5>
                  <div class="param-table">
                    <div class="param-header">
                      <span>参数名</span>
                      <span>类型</span>
                      <span>必填</span>
                      <span>说明</span>
                    </div>
                    <div
                      v-for="param in api.parameters.header"
                      :key="param.name"
                      class="param-row"
                    >
                      <code>{{ param.name }}</code>
                      <span class="param-type">{{ param.type }}</span>
                      <el-tag :type="param.required ? 'danger' : 'info'" size="small">
                        {{ param.required ? '必填' : '可选' }}
                      </el-tag>
                      <span>{{ param.description || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 请求体 -->
              <div class="api-section" v-if="api.requestBody">
                <h4>请求体</h4>
                <div class="content-type">
                  <strong>Content-Type:</strong> {{ api.requestBody.contentType }}
                </div>
                <div class="schema-section" v-if="api.requestBody.schema">
                  <h5>数据结构</h5>
                  <div class="schema-preview">
                    <pre><code>{{ formatJson(api.requestBody.schema) }}</code></pre>
                  </div>
                </div>
                <div class="example-section" v-if="api.requestBody.example">
                  <h5>示例</h5>
                  <div class="code-block">
                    <pre><code>{{ formatJson(api.requestBody.example) }}</code></pre>
                  </div>
                </div>
              </div>
              
              <!-- 响应 -->
              <div class="api-section" v-if="api.responses && Object.keys(api.responses).length">
                <h4>响应</h4>
                <div
                  v-for="(response, statusCode) in api.responses"
                  :key="statusCode"
                  class="response-item"
                >
                  <div class="response-header">
                    <el-tag
                      :type="getStatusCodeType(statusCode)"
                      size="small"
                    >
                      {{ statusCode }}
                    </el-tag>
                    <span class="response-description">{{ response.description }}</span>
                  </div>
                  
                  <div class="response-content" v-if="response.schema || response.example">
                    <div class="schema-section" v-if="response.schema">
                      <h6>数据结构</h6>
                      <div class="schema-preview">
                        <pre><code>{{ formatJson(response.schema) }}</code></pre>
                      </div>
                    </div>
                    
                    <div class="example-section" v-if="response.example">
                      <h6>示例</h6>
                      <div class="code-block">
                        <pre><code>{{ formatJson(response.example) }}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 代码示例 -->
              <div class="api-section" v-if="api.examples && Object.keys(api.examples).length > 0">
                <h4>代码示例</h4>
                <el-tabs class="example-tabs">
                  <el-tab-pane
                    v-for="(code, language) in api.examples"
                    :key="language"
                    :label="language"
                  >
                    <div class="code-block">
                      <pre><code>{{ code }}</code></pre>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分享对话框 -->
    <el-dialog v-model="shareDialogVisible" title="分享文档" width="500px">
      <div class="share-options">
        <div class="share-item">
          <label>分享链接</label>
          <el-input
            v-model="shareUrl"
            readonly
            class="share-input"
          >
            <template #append>
              <el-button @click="copyShareUrl">复制</el-button>
            </template>
          </el-input>
        </div>
        
        <div class="share-item">
          <label>访问权限</label>
          <el-radio-group v-model="sharePermission">
            <el-radio label="public">公开访问</el-radio>
            <el-radio label="private">仅限团队</el-radio>
          </el-radio-group>
        </div>
        
        <div class="share-item">
          <label>有效期</label>
          <el-select v-model="shareExpiry" placeholder="选择有效期">
            <el-option label="永久有效" value="never" />
            <el-option label="7天" value="7d" />
            <el-option label="30天" value="30d" />
            <el-option label="90天" value="90d" />
          </el-select>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Moon,
  Sunny,
  Download,
  Share,
  Printer
} from '@element-plus/icons-vue'
import type { Documentation } from '@/types'

interface Props {
  documentation: Documentation
  theme?: any
}

const props = defineProps<Props>()

const isDark = ref(false)
const shareDialogVisible = ref(false)
const shareUrl = ref('')
const sharePermission = ref('public')
const shareExpiry = ref('never')

// 主题样式
const themeStyles = computed(() => {
  if (!props.theme) return {}
  
  return {
    '--primary-color': props.theme.colors?.primary || '#409EFF',
    '--success-color': props.theme.colors?.success || '#67C23A',
    '--warning-color': props.theme.colors?.warning || '#E6A23C',
    '--error-color': props.theme.colors?.error || '#F56C6C',
    '--text-primary': props.theme.colors?.textPrimary || '#303133',
    '--text-secondary': props.theme.colors?.textSecondary || '#606266',
    '--background-color': props.theme.colors?.background || '#ffffff',
    '--surface-color': props.theme.colors?.surface || '#ffffff',
    '--font-family': props.theme.typography?.fontFamily === 'system' ? 'system-ui' : props.theme.typography?.fontFamily || 'system-ui',
    '--font-size': `${props.theme.typography?.fontSize || 14}px`,
    '--line-height': props.theme.typography?.lineHeight || 1.5,
    '--border-radius': `${props.theme.components?.card?.borderRadius || 6}px`
  }
})

// 获取状态类型
const getStatusType = (status?: string) => {
  if (!status) return 'info'
  const statusMap: Record<string, string> = {
    draft: 'info',
    published: 'success',
    archived: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status?: string) => {
  if (!status) return '未知'
  const statusMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return statusMap[status] || '未知'
}

// 获取方法类型
const getMethodType = (method: string) => {
  const methodMap: Record<string, string> = {
    get: 'success',
    post: 'primary',
    put: 'warning',
    delete: 'danger',
    patch: 'info'
  }
  return methodMap[method.toLowerCase()] || 'info'
}

// 获取状态码类型
const getStatusCodeType = (statusCode: string | number) => {
  const code = typeof statusCode === 'string' ? parseInt(statusCode) : statusCode
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'warning'
  if (code >= 400) return 'danger'
  return 'info'
}

// 检查是否有参数
const hasParameters = (api: any) => {
  return api.parameters && (
    (api.parameters.path && api.parameters.path.length > 0) ||
    (api.parameters.query && api.parameters.query.length > 0) ||
    (api.parameters.header && api.parameters.header.length > 0)
  )
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 渲染Markdown
const renderMarkdown = (text: string) => {
  if (!text) return ''
  
  // 简单的Markdown渲染
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 格式化JSON
const formatJson = (obj: any) => {
  if (typeof obj === 'string') {
    try {
      return JSON.stringify(JSON.parse(obj), null, 2)
    } catch {
      return obj
    }
  }
  return JSON.stringify(obj, null, 2)
}

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value
}

// 导出文档
const exportDoc = () => {
  // 创建打印样式
  const printContent = document.querySelector('.preview-content')?.innerHTML
  if (!printContent) return
  
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${props.documentation.title || '文档'}</title>
      <style>
        body { font-family: system-ui; line-height: 1.6; color: #333; }
        .api-item { margin-bottom: 2rem; page-break-inside: avoid; }
        .method-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .param-table { border-collapse: collapse; width: 100%; }
        .param-table th, .param-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .code-block { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        pre { margin: 0; white-space: pre-wrap; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>${printContent}</body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.print()
  
  ElMessage.success('文档已导出')
}

// 分享文档
const shareDoc = () => {
  shareUrl.value = `${window.location.origin}/docs/${props.documentation.id}`
  shareDialogVisible.value = true
}

// 复制分享链接
const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 打印文档
const printDoc = () => {
  window.print()
}
</script>

<style lang="scss" scoped>
.doc-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.preview-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
}

.doc-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #909399;
  
  .version {
    font-weight: 500;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  font-family: var(--font-family, system-ui);
  font-size: var(--font-size, 14px);
  line-height: var(--line-height, 1.5);
  color: var(--text-primary, #303133);
  background: var(--background-color, #ffffff);
  
  &.dark-theme {
    background: #1a1a1a;
    color: #ffffff;
  }
}

.doc-info {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
  
  .description {
    margin-bottom: 24px;
    font-size: 16px;
    line-height: 1.6;
  }
  
  h3 {
    margin: 24px 0 12px 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.contact-item,
.license-item {
  margin-bottom: 8px;
  
  strong {
    margin-right: 8px;
  }
  
  a {
    color: var(--primary-color, #409EFF);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.api-group {
  margin-bottom: 48px;
}

.group-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.group-description {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: var(--text-secondary, #606266);
}

.api-item {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--surface-color, #ffffff);
  border: 1px solid #e4e7ed;
  border-radius: var(--border-radius, 6px);
}

.api-header {
  margin-bottom: 16px;
}

.api-method-path {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.method-tag {
  font-weight: 600;
  font-family: monospace;
}

.api-path {
  font-family: monospace;
  font-size: 16px;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.api-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.api-description {
  margin-bottom: 20px;
  color: var(--text-secondary, #606266);
}

.api-section {
  margin-bottom: 24px;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #303133);
  }
  
  h5 {
    margin: 16px 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #303133);
  }
  
  h6 {
    margin: 12px 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #606266);
  }
}

.param-group {
  margin-bottom: 20px;
}

.param-table {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.param-header {
  display: grid;
  grid-template-columns: 1fr 80px 60px 1fr;
  background: #f8f9fa;
  font-weight: 600;
  font-size: 13px;
  
  span {
    padding: 12px;
    border-right: 1px solid #e4e7ed;
    
    &:last-child {
      border-right: none;
    }
  }
}

.param-row {
  display: grid;
  grid-template-columns: 1fr 80px 60px 1fr;
  border-top: 1px solid #e4e7ed;
  
  > * {
    padding: 12px;
    border-right: 1px solid #e4e7ed;
    
    &:last-child {
      border-right: none;
    }
  }
  
  code {
    font-family: monospace;
    background: #f5f5f5;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 12px;
  }
}

.param-type {
  font-family: monospace;
  font-size: 12px;
  color: var(--primary-color, #409EFF);
}

.content-type {
  margin-bottom: 16px;
  font-size: 14px;
  
  strong {
    margin-right: 8px;
  }
}

.schema-preview,
.code-block {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow-x: auto;
  
  pre {
    margin: 0;
    padding: 16px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.4;
  }
}

.response-item {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.response-header {
  padding: 12px 16px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .response-description {
    font-size: 14px;
    color: var(--text-secondary, #606266);
  }
}

.response-content {
  padding: 16px;
}

.example-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.share-options {
  .share-item {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #303133;
    }
  }
}

.share-input {
  :deep(.el-input-group__append) {
    padding: 0;
  }
}

// 打印样式
@media print {
  .preview-header,
  .header-actions {
    display: none;
  }
  
  .preview-content {
    padding: 0;
    background: white !important;
    color: black !important;
  }
  
  .api-item {
    page-break-inside: avoid;
    border: 1px solid #ccc;
    margin-bottom: 20px;
  }
}

// 深色主题
.dark-theme {
  .api-item {
    background: #2d2d2d;
    border-color: #404040;
  }
  
  .param-table {
    border-color: #404040;
  }
  
  .param-header {
    background: #404040;
  }
  
  .param-row {
    border-color: #404040;
    
    > * {
      border-color: #404040;
    }
    
    code {
      background: #404040;
      color: #ffffff;
    }
  }
  
  .schema-preview,
  .code-block {
    background: #2d2d2d;
    border-color: #404040;
    
    pre {
      color: #ffffff;
    }
  }
  
  .response-item {
    border-color: #404040;
  }
  
  .response-header {
    background: #404040;
  }
}
</style>