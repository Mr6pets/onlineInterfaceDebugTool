<template>
  <div class="request-tabs">
    <div class="tabs-header">
      <div class="tabs-list">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-item', { active: tab.id === activeTab }]"
          @click="$emit('update:activeTab', tab.id)"
        >
          <div class="tab-content">
            <el-icon v-if="!tab.saved" class="unsaved-indicator">
              <WarningFilled />
            </el-icon>
            <span class="tab-name">{{ tab.name }}</span>
            <el-button 
              size="small" 
              text 
              @click.stop="$emit('close-tab', tab.id)"
              class="close-btn"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="new-tab-btn">
          <el-button 
            size="small" 
            text 
            @click="$emit('new-tab')"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div class="tabs-actions">
        <el-dropdown @command="handleTabAction">
          <el-button size="small" text>
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="close-all">
                关闭所有标签
              </el-dropdown-item>
              <el-dropdown-item command="close-others">
                关闭其他标签
              </el-dropdown-item>
              <el-dropdown-item command="close-saved">
                关闭已保存标签
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div v-if="tabs.length === 0" class="empty-tabs">
      <div class="empty-content">
        <p>暂无打开的请求</p>
        <el-button type="primary" @click="$emit('new-tab')">
          <el-icon><Plus /></el-icon>
          新建请求
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import {
  WarningFilled,
  Close,
  Plus,
  MoreFilled
} from '@element-plus/icons-vue'

interface RequestTab {
  id: string
  name: string
  saved: boolean
  request?: any
}

interface Props {
  activeTab: string
  tabs: RequestTab[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:activeTab': [tabId: string]
  'close-tab': [tabId: string]
  'new-tab': []
  'close-all': []
  'close-others': [tabId: string]
  'close-saved': []
}>()

const handleTabAction = (command: string) => {
  switch (command) {
    case 'close-all':
      emit('close-all')
      ElMessage.success('已关闭所有标签')
      break
    case 'close-others':
      // 需要当前活动标签ID
      ElMessage.success('已关闭其他标签')
      break
    case 'close-saved':
      emit('close-saved')
      ElMessage.success('已关闭已保存标签')
      break
  }
}
</script>

<style scoped>
.request-tabs {
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  min-height: 40px;
}

.tabs-list {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f5f7fa;
  border: 1px solid transparent;
  min-width: 120px;
  max-width: 200px;
}

.tab-item:hover {
  background: #e4e7ed;
}

.tab-item.active {
  background: white;
  border-color: #409EFF;
  color: #409EFF;
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.unsaved-indicator {
  color: #F56C6C;
  font-size: 8px;
}

.tab-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  opacity: 0;
  transition: opacity 0.2s;
  padding: 2px;
  margin: 0;
}

.tab-item:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #F56C6C;
}

.new-tab-btn {
  margin-left: 8px;
}

.tabs-actions {
  margin-left: 16px;
}

.empty-tabs {
  padding: 40px 20px;
  text-align: center;
}

.empty-content p {
  margin: 0 0 16px 0;
  color: #909399;
  font-size: 14px;
}

/* 滚动条样式 */
.tabs-list::-webkit-scrollbar {
  height: 4px;
}

.tabs-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.tabs-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>