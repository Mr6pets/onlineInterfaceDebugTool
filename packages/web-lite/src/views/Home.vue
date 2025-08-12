<template>
  <div class="home-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="logo">
          <el-icon class="logo-icon"><Connection /></el-icon>
          <span class="logo-text">API调试工具</span>
        </div>
        
        <!-- 环境选择器 -->
        <el-select
          v-model="environmentStore.currentEnvironmentId"
          placeholder="选择环境"
          class="env-selector"
          @change="handleEnvironmentChange"
        >
          <el-option
            v-for="env in environmentStore.environments"
            :key="env.id"
            :label="env.name"
            :value="env.id"
          />
        </el-select>
      </div>
      
      <div class="toolbar-right">
        <!-- 历史记录按钮 -->
        <el-button
          type="text"
          @click="$router.push('/history')"
          class="toolbar-btn"
        >
          <el-icon><Clock /></el-icon>
          历史记录
        </el-button>
        
        <!-- 环境管理按钮 -->
        <el-button
          type="text"
          @click="$router.push('/environments')"
          class="toolbar-btn"
        >
          <el-icon><Setting /></el-icon>
          环境管理
        </el-button>
        
        <!-- 设置按钮 -->
        <el-button
          type="text"
          @click="$router.push('/settings')"
          class="toolbar-btn"
        >
          <el-icon><Tools /></el-icon>
          设置
        </el-button>
        
        <!-- 主题切换 -->
        <el-button
          type="text"
          @click="settingsStore.toggleTheme()"
          class="toolbar-btn"
        >
          <el-icon><Sunny v-if="settingsStore.getEffectiveTheme() === 'light'" /><Moon v-else /></el-icon>
        </el-button>
        
        <!-- 布局切换 -->
        <el-button
          type="text"
          @click="settingsStore.toggleLayout()"
          class="toolbar-btn"
        >
          <el-icon><Grid v-if="settingsStore.settings.layout === 'horizontal'" /><Menu v-else /></el-icon>
        </el-button>
        
        <!-- 清空按钮 -->
        <el-button
          type="danger"
          @click="handleClearAll"
          class="clear-btn"
        >
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content" :class="layoutClass">
      <!-- 请求配置面板 -->
      <div class="request-section">
        <RequestPanel />
      </div>
      
      <!-- 响应展示面板 -->
      <div class="response-section">
        <ResponsePanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Connection,
  Clock,
  Setting,
  Tools,
  Sunny,
  Moon,
  Grid,
  Menu,
  Delete
} from '@element-plus/icons-vue'
import RequestPanel from '@/components/RequestPanel.vue'
import ResponsePanel from '@/components/ResponsePanel.vue'
import { useRequestStore } from '@/stores/request'
import { useHistoryStore } from '@/stores/history'
import { useEnvironmentStore } from '@/stores/environment'
import { useSettingsStore } from '@/stores/settings'

// 状态管理
const requestStore = useRequestStore()
const historyStore = useHistoryStore()
const environmentStore = useEnvironmentStore()
const settingsStore = useSettingsStore()

// 计算属性：布局类名
const layoutClass = computed(() => ({
  'layout-horizontal': settingsStore.settings.layout === 'horizontal',
  'layout-vertical': settingsStore.settings.layout === 'vertical'
}))

// 处理环境切换
const handleEnvironmentChange = (envId: string) => {
  environmentStore.switchEnvironment(envId)
  ElMessage.success(`已切换到环境：${environmentStore.currentEnvironment?.name}`)
}

// 处理清空所有数据
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空当前请求和响应数据吗？',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    requestStore.clearAll()
    ElMessage.success('已清空所有数据')
  } catch {
    // 用户取消操作
  }
}

// 初始化默认环境
if (environmentStore.environments.length === 0) {
  environmentStore.initializeDefaultEnvironments()
}
</script>

<style scoped lang="scss">
.home-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #f5f7fa);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color, #303133);
      
      .logo-icon {
        font-size: 24px;
        color: #409eff;
      }
    }
    
    .env-selector {
      width: 200px;
    }
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .toolbar-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.3s;
      
      &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }
    
    .clear-btn {
      margin-left: 12px;
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  
  &.layout-horizontal {
    flex-direction: row;
    
    .request-section,
    .response-section {
      flex: 1;
      min-width: 0;
    }
  }
  
  &.layout-vertical {
    flex-direction: column;
    
    .request-section {
      flex: 0 0 auto;
      max-height: 50%;
    }
    
    .response-section {
      flex: 1;
      min-height: 0;
    }
  }
}

.request-section,
.response-section {
  background: var(--card-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

// 响应式设计
@media (max-width: 768px) {
  .toolbar {
    padding: 8px 12px;
    
    .toolbar-left {
      gap: 12px;
      
      .logo {
        .logo-text {
          display: none;
        }
      }
      
      .env-selector {
        width: 120px;
      }
    }
    
    .toolbar-right {
      gap: 4px;
      
      .toolbar-btn {
        padding: 6px 8px;
        
        span {
          display: none;
        }
      }
    }
  }
  
  .main-content {
    padding: 8px;
    gap: 8px;
    
    &.layout-horizontal {
      flex-direction: column;
      
      .request-section {
        flex: 0 0 auto;
        max-height: 50%;
      }
      
      .response-section {
        flex: 1;
        min-height: 0;
      }
    }
  }
}

// 暗色主题
:global(.theme-dark) {
  .home-container {
    background: #1a1a1a;
  }
  
  .toolbar {
    background: #2a2a2a;
    border-bottom-color: #404040;
  }
  
  .request-section,
  .response-section {
    background: #2a2a2a;
  }
}
</style>