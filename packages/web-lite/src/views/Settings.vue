<template>
  <div class="settings-container">
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
        <h1 class="page-title">设置</h1>
      </div>
      
      <div class="header-right">
        <el-button
          type="success"
          @click="handleExport"
        >
          <el-icon><Download /></el-icon>
          导出设置
        </el-button>
        
        <el-button
          type="warning"
          @click="handleImport"
        >
          <el-icon><Upload /></el-icon>
          导入设置
        </el-button>
        
        <el-button
          type="danger"
          @click="handleReset"
        >
          <el-icon><RefreshLeft /></el-icon>
          重置设置
        </el-button>
      </div>
    </div>
    
    <!-- 设置内容 -->
    <div class="settings-content">
      <div class="settings-sections">
        <!-- 外观设置 -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <el-icon><Sunny /></el-icon>
              外观设置
            </h2>
          </div>
          
          <div class="section-content">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">主题模式</span>
                <span class="label-desc">选择浅色或深色主题</span>
              </div>
              <div class="setting-control">
                <el-radio-group
                  v-model="settingsStore.settings.theme"
                  @change="settingsStore.updateSettings({ theme: $event })"
                >
                  <el-radio-button label="light">浅色</el-radio-button>
                  <el-radio-button label="dark">深色</el-radio-button>
                  <el-radio-button label="auto">跟随系统</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">字体大小</span>
                <span class="label-desc">调整界面字体大小</span>
              </div>
              <div class="setting-control">
                <el-slider
                  v-model="settingsStore.settings.fontSize"
                  :min="12"
                  :max="18"
                  :step="1"
                  :marks="fontSizeMarks"
                  @change="settingsStore.updateSettings({ fontSize: $event })"
                  style="width: 200px;"
                />
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">布局模式</span>
                <span class="label-desc">选择请求和响应面板的布局方式</span>
              </div>
              <div class="setting-control">
                <el-radio-group
                  v-model="settingsStore.settings.layout"
                  @change="settingsStore.updateSettings({ layout: $event })"
                >
                  <el-radio-button label="horizontal">水平布局</el-radio-button>
                  <el-radio-button label="vertical">垂直布局</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 功能设置 -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <el-icon><Setting /></el-icon>
              功能设置
            </h2>
          </div>
          
          <div class="section-content">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">自动保存</span>
                <span class="label-desc">自动保存请求配置到历史记录</span>
              </div>
              <div class="setting-control">
                <el-switch
                  v-model="settingsStore.settings.autoSave"
                  @change="settingsStore.updateSettings({ autoSave: $event })"
                />
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">请求超时</span>
                <span class="label-desc">设置请求的超时时间（秒）</span>
              </div>
              <div class="setting-control">
                <el-input-number
                  v-model="settingsStore.settings.requestTimeout"
                  :min="5"
                  :max="300"
                  :step="5"
                  @change="settingsStore.updateSettings({ requestTimeout: $event })"
                  style="width: 120px;"
                />
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">SSL验证</span>
                <span class="label-desc">验证HTTPS请求的SSL证书</span>
              </div>
              <div class="setting-control">
                <el-switch
                  v-model="settingsStore.settings.verifySsl"
                  @change="settingsStore.updateSettings({ verifySsl: $event })"
                />
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">跟随重定向</span>
                <span class="label-desc">自动跟随HTTP重定向响应</span>
              </div>
              <div class="setting-control">
                <el-switch
                  v-model="settingsStore.settings.followRedirects"
                  @change="settingsStore.updateSettings({ followRedirects: $event })"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- 历史记录设置 -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <el-icon><Clock /></el-icon>
              历史记录设置
            </h2>
          </div>
          
          <div class="section-content">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">最大历史记录数</span>
                <span class="label-desc">限制保存的历史记录数量</span>
              </div>
              <div class="setting-control">
                <el-input-number
                  v-model="settingsStore.settings.maxHistoryItems"
                  :min="10"
                  :max="1000"
                  :step="10"
                  @change="settingsStore.updateSettings({ maxHistoryItems: $event })"
                  style="width: 120px;"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- 编辑器设置 -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <el-icon><EditPen /></el-icon>
              编辑器设置
            </h2>
          </div>
          
          <div class="section-content">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">显示行号</span>
                <span class="label-desc">在代码编辑器中显示行号</span>
              </div>
              <div class="setting-control">
                <el-switch
                  v-model="settingsStore.settings.showLineNumbers"
                  @change="settingsStore.updateSettings({ showLineNumbers: $event })"
                />
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">自动换行</span>
                <span class="label-desc">在编辑器中启用自动换行</span>
              </div>
              <div class="setting-control">
                <el-switch
                  v-model="settingsStore.settings.wordWrap"
                  @change="settingsStore.updateSettings({ wordWrap: $event })"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- 关于信息 -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <el-icon><InfoFilled /></el-icon>
              关于
            </h2>
          </div>
          
          <div class="section-content">
            <div class="about-info">
              <div class="app-info">
                <h3 class="app-name">API调试工具 Lite版</h3>
                <p class="app-version">版本 2.0.0</p>
                <p class="app-description">
                  一个现代化的API接口调试工具，支持多种HTTP方法、环境变量管理、历史记录等功能。
                </p>
              </div>
              
              <div class="tech-stack">
                <h4>技术栈</h4>
                <div class="tech-tags">
                  <el-tag>Vue 3</el-tag>
                  <el-tag>TypeScript</el-tag>
                  <el-tag>Element Plus</el-tag>
                  <el-tag>Pinia</el-tag>
                  <el-tag>Vite</el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      title="导入设置"
      width="500px"
    >
      <el-form>
        <el-form-item label="JSON数据">
          <el-input
            v-model="importDialog.data"
            type="textarea"
            :rows="8"
            placeholder="请粘贴导出的设置JSON数据"
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
import { reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Download,
  Upload,
  RefreshLeft,
  Sunny,
  Setting,
  Clock,
  EditPen,
  InfoFilled
} from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

// 字体大小标记
const fontSizeMarks = {
  12: '小',
  14: '中',
  16: '大',
  18: '特大'
}

// 导入对话框
const importDialog = reactive({
  visible: false,
  data: ''
})

// 处理导出设置
const handleExport = () => {
  const data = settingsStore.exportSettings()
  downloadFile(data, 'api-debug-settings.json')
  ElMessage.success('设置已导出')
}

// 处理导入设置
const handleImport = () => {
  importDialog.visible = true
  importDialog.data = ''
}

// 确认导入
const handleConfirmImport = () => {
  if (settingsStore.importSettings(importDialog.data)) {
    importDialog.visible = false
    importDialog.data = ''
    ElMessage.success('设置导入成功')
  } else {
    ElMessage.error('导入失败，请检查数据格式')
  }
}

// 处理重置设置
const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置到默认值吗？此操作不可恢复。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    settingsStore.resetSettings()
    ElMessage.success('设置已重置')
  } catch {
    // 用户取消操作
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
</script>

<style scoped lang="scss">
.settings-container {
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

.settings-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  .settings-sections {
    max-width: 800px;
    margin: 0 auto;
  }
}

.settings-section {
  background: var(--card-bg, #ffffff);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid var(--border-color, #dcdfe6);
  
  .section-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    .section-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color, #303133);
      display: flex;
      align-items: center;
      gap: 8px;
      
      .el-icon {
        color: var(--el-color-primary);
      }
    }
  }
  
  .section-content {
    padding: 0;
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  
  &:last-child {
    border-bottom: none;
  }
  
  .setting-label {
    flex: 1;
    
    .label-text {
      display: block;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-color, #303133);
      margin-bottom: 4px;
    }
    
    .label-desc {
      display: block;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      line-height: 1.4;
    }
  }
  
  .setting-control {
    flex: 0 0 auto;
    margin-left: 20px;
  }
}

.about-info {
  padding: 24px;
  
  .app-info {
    margin-bottom: 24px;
    
    .app-name {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-color, #303133);
    }
    
    .app-version {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--el-color-primary);
      font-weight: 500;
    }
    
    .app-description {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
    }
  }
  
  .tech-stack {
    h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-color, #303133);
    }
    
    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    .header-right {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
  
  .settings-content {
    padding: 12px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    
    .setting-control {
      margin-left: 0;
      align-self: flex-end;
    }
  }
  
  .about-info {
    padding: 16px;
    
    .tech-tags {
      justify-content: center;
    }
  }
}
</style>