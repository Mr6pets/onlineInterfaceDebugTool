<template>
  <div class="history-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          type="text"
          @click="$router.back()"
          class="back-btn"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">历史记录</h1>
      </div>
      
      <div class="header-right">
        <el-button
          type="primary"
          @click="handleExport"
          :disabled="historyStore.items.length === 0"
        >
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        
        <el-button
          type="success"
          @click="handleImport"
        >
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        
        <el-button
          type="danger"
          @click="handleClearHistory"
          :disabled="historyStore.items.length === 0"
        >
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>
    
    <!-- 搜索和过滤 -->
    <div class="search-filter">
      <div class="search-section">
        <el-input
          v-model="historyStore.searchText"
          placeholder="搜索历史记录..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="filter-section">
        <el-radio-group v-model="historyStore.filterType" @change="handleFilterChange">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="favorite">收藏</el-radio-button>
          <el-radio-button label="method">按方法</el-radio-button>
        </el-radio-group>
        
        <el-select
          v-if="historyStore.filterType === 'method'"
          v-model="historyStore.selectedMethod"
          placeholder="选择方法"
          class="method-filter"
          @change="handleMethodFilter"
        >
          <el-option
            v-for="method in availableMethods"
            :key="method"
            :label="method"
            :value="method"
          />
        </el-select>
      </div>
    </div>
    
    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ historyStore.items.length }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ historyStore.favoriteItems.length }}</div>
              <div class="stat-label">收藏记录</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ historyStore.filteredItems.length }}</div>
              <div class="stat-label">筛选结果</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ Object.keys(historyStore.methodStats).length }}</div>
              <div class="stat-label">使用方法</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 历史记录列表 -->
    <div class="history-list">
      <el-empty
        v-if="historyStore.filteredItems.length === 0"
        description="暂无历史记录"
        class="empty-state"
      />
      
      <div v-else class="history-items">
        <div
          v-for="item in historyStore.filteredItems"
          :key="item.id"
          class="history-item"
          @click="handleItemClick(item)"
        >
          <div class="item-header">
            <div class="method-badge" :class="`method-${item.request.method.toLowerCase()}`">
              {{ item.request.method }}
            </div>
            <div class="url-info">
              <div class="url">{{ item.request.url }}</div>
              <div class="name" v-if="item.name">{{ item.name }}</div>
            </div>
            <div class="item-actions">
              <el-button
                type="text"
                @click.stop="handleToggleFavorite(item.id)"
                class="favorite-btn"
              >
                <el-icon>
                  <StarFilled v-if="item.favorite" class="favorited" />
                  <Star v-else />
                </el-icon>
              </el-button>
              
              <el-dropdown @command="(command) => handleItemAction(command, item)">
                <el-button type="text">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑名称</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制请求</el-dropdown-item>
                    <el-dropdown-item command="export">导出单项</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="item-details">
            <div class="status-info">
              <el-tag
                :type="getStatusType(item.response?.status)"
                size="small"
              >
                {{ item.response?.status || 'N/A' }}
              </el-tag>
              <span class="duration">{{ formatDuration(item.response?.duration) }}</span>
            </div>
            
            <div class="timestamp">
              {{ formatTimestamp(item.timestamp) }}
            </div>
          </div>
          
          <div class="item-tags" v-if="item.tags && item.tags.length > 0">
            <el-tag
              v-for="tag in item.tags"
              :key="tag"
              size="small"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑名称对话框 -->
    <el-dialog
      v-model="editNameDialog.visible"
      title="编辑名称"
      width="400px"
    >
      <el-form>
        <el-form-item label="名称">
          <el-input
            v-model="editNameDialog.name"
            placeholder="请输入名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editNameDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveName">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      title="导入历史记录"
      width="500px"
    >
      <el-form>
        <el-form-item label="JSON数据">
          <el-input
            v-model="importDialog.data"
            type="textarea"
            :rows="10"
            placeholder="请粘贴导出的JSON数据"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="importDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Download,
  Upload,
  Delete,
  Search,
  Star,
  StarFilled,
  MoreFilled
} from '@element-plus/icons-vue'
import { useHistoryStore } from '@/stores/history'
import { useRequestStore } from '@/stores/request'
import type { HistoryItem } from '@/types'

const router = useRouter()
const historyStore = useHistoryStore()
const requestStore = useRequestStore()

// 编辑名称对话框
const editNameDialog = ref({
  visible: false,
  itemId: '',
  name: ''
})

// 导入对话框
const importDialog = ref({
  visible: false,
  data: ''
})

// 计算属性：可用的HTTP方法
const availableMethods = computed(() => {
  const methods = new Set<string>()
  historyStore.items.forEach(item => {
    methods.add(item.request.method)
  })
  return Array.from(methods).sort()
})

// 处理过滤器变化
const handleFilterChange = (type: string) => {
  historyStore.setFilter(type)
}

// 处理方法过滤
const handleMethodFilter = (method: string) => {
  historyStore.setFilter('method', method)
}

// 处理历史记录项点击
const handleItemClick = (item: HistoryItem) => {
  requestStore.loadFromHistory(item)
  router.push('/')
  ElMessage.success('已加载历史请求')
}

// 处理收藏切换
const handleToggleFavorite = (id: string) => {
  historyStore.toggleFavorite(id)
}

// 处理项目操作
const handleItemAction = (command: string, item: HistoryItem) => {
  switch (command) {
    case 'edit':
      editNameDialog.value = {
        visible: true,
        itemId: item.id,
        name: item.name || ''
      }
      break
    case 'duplicate':
      requestStore.loadFromHistory(item)
      router.push('/')
      ElMessage.success('已复制请求到主界面')
      break
    case 'export':
      exportSingleItem(item)
      break
    case 'delete':
      handleDeleteItem(item.id)
      break
  }
}

// 处理保存名称
const handleSaveName = () => {
  historyStore.updateItemName(editNameDialog.value.itemId, editNameDialog.value.name)
  editNameDialog.value.visible = false
  ElMessage.success('名称已更新')
}

// 处理删除项目
const handleDeleteItem = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条历史记录吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    historyStore.removeItem(id)
    ElMessage.success('已删除历史记录')
  } catch {
    // 用户取消操作
  }
}

// 处理清空历史记录
const handleClearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    historyStore.clearHistory()
    ElMessage.success('已清空历史记录')
  } catch {
    // 用户取消操作
  }
}

// 处理导出
const handleExport = () => {
  const data = historyStore.exportHistory()
  downloadFile(data, 'api-debug-history.json')
  ElMessage.success('历史记录已导出')
}

// 导出单个项目
const exportSingleItem = (item: HistoryItem) => {
  const data = JSON.stringify(item, null, 2)
  downloadFile(data, `api-debug-${item.id}.json`)
  ElMessage.success('历史记录已导出')
}

// 处理导入
const handleImport = () => {
  importDialog.value.visible = true
}

// 确认导入
const handleConfirmImport = () => {
  if (historyStore.importHistory(importDialog.value.data)) {
    importDialog.value.visible = false
    importDialog.value.data = ''
    ElMessage.success('历史记录导入成功')
  } else {
    ElMessage.error('导入失败，请检查数据格式')
  }
}

// 下载文件
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 获取状态类型
const getStatusType = (status?: number) => {
  if (!status) return 'info'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400) return 'danger'
  return 'info'
}

// 格式化持续时间
const formatDuration = (duration?: number) => {
  if (!duration) return 'N/A'
  if (duration < 1000) return `${duration}ms`
  return `${(duration / 1000).toFixed(2)}s`
}

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<style scoped lang="scss">
.history-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #f5f7fa);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-color, #303133);
    }
  }
  
  .header-right {
    display: flex;
    gap: 8px;
  }
}

.search-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  
  .search-section {
    flex: 1;
    max-width: 400px;
    
    .search-input {
      width: 100%;
    }
  }
  
  .filter-section {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .method-filter {
      width: 120px;
    }
  }
}

.stats-section {
  padding: 16px 20px;
  
  .stat-card {
    text-align: center;
    
    .stat-content {
      .stat-number {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-color-primary);
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.history-list {
  flex: 1;
  padding: 0 20px 20px;
  overflow-y: auto;
  
  .empty-state {
    margin-top: 60px;
  }
  
  .history-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.history-item {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
  
  .item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    
    .method-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      
      &.method-get { background: #67c23a; }
      &.method-post { background: #409eff; }
      &.method-put { background: #e6a23c; }
      &.method-delete { background: #f56c6c; }
      &.method-patch { background: #909399; }
      &.method-head { background: #909399; }
      &.method-options { background: #909399; }
    }
    
    .url-info {
      flex: 1;
      min-width: 0;
      
      .url {
        font-weight: 500;
        color: var(--text-color, #303133);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .name {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }
    
    .item-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .favorite-btn {
        .favorited {
          color: #f7ba2a;
        }
      }
    }
  }
  
  .item-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .status-info {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .duration {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
    
    .timestamp {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
  
  .item-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    
    .tag-item {
      font-size: 10px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .search-filter {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    .filter-section {
      justify-content: center;
    }
  }
  
  .stats-section {
    .el-col {
      margin-bottom: 8px;
    }
  }
  
  .history-item {
    .item-header {
      flex-wrap: wrap;
      
      .url-info {
        order: 3;
        flex-basis: 100%;
      }
    }
  }
}
</style>