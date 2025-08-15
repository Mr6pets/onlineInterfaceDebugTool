<template>
  <div class="theme-customizer">
    <div class="customizer-header">
      <h3>主题自定义</h3>
      <div class="header-actions">
        <el-button @click="resetTheme" size="small" text>
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
        <el-button @click="exportTheme" size="small" text>
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="importTheme" size="small" text>
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
      </div>
    </div>
    
    <div class="customizer-content">
      <el-tabs v-model="activeTab" class="theme-tabs">
        <!-- 基础设置 -->
        <el-tab-pane label="基础设置" name="basic">
          <div class="theme-section">
            <h4>布局设置</h4>
            <div class="setting-item">
              <label>布局模式</label>
              <el-radio-group v-model="theme.layout.mode">
                <el-radio label="sidebar">侧边栏</el-radio>
                <el-radio label="topbar">顶部导航</el-radio>
                <el-radio label="mixed">混合模式</el-radio>
              </el-radio-group>
            </div>
            
            <div class="setting-item">
              <label>内容宽度</label>
              <el-radio-group v-model="theme.layout.width">
                <el-radio label="fluid">流式</el-radio>
                <el-radio label="boxed">固定宽度</el-radio>
              </el-radio-group>
            </div>
            
            <div class="setting-item" v-if="theme.layout.width === 'boxed'">
              <label>最大宽度</label>
              <el-slider
                v-model="theme.layout.maxWidth"
                :min="1000"
                :max="1600"
                :step="50"
                show-input
              />
            </div>
          </div>
          
          <div class="theme-section">
            <h4>字体设置</h4>
            <div class="setting-item">
              <label>主字体</label>
              <el-select v-model="theme.typography!.fontFamily" placeholder="选择字体">
                <el-option label="系统默认" value="system" />
                <el-option label="思源黑体" value="Source Han Sans" />
                <el-option label="微软雅黑" value="Microsoft YaHei" />
                <el-option label="苹方" value="PingFang SC" />
                <el-option label="Roboto" value="Roboto" />
                <el-option label="Open Sans" value="Open Sans" />
              </el-select>
            </div>
            
            <div class="setting-item">
              <label>基础字号</label>
              <el-slider
                v-model="theme.typography!.fontSize"
                :min="12"
                :max="18"
                :step="1"
                show-input
              />
            </div>
            
            <div class="setting-item">
              <label>行高</label>
              <el-slider
                v-model="theme.typography!.lineHeight"
                :min="1.2"
                :max="2.0"
                :step="0.1"
                show-input
              />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 颜色设置 -->
        <el-tab-pane label="颜色设置" name="colors">
          <div class="theme-section">
            <h4>主题色彩</h4>
            <div class="color-grid">
              <div class="color-item">
                <label>主色调</label>
                <el-color-picker v-model="theme.colors!.primary" />
              </div>
              <div class="color-item">
                <label>成功色</label>
                <el-color-picker v-model="theme.colors!.success" />
              </div>
              <div class="color-item">
                <label>警告色</label>
                <el-color-picker v-model="theme.colors!.warning" />
              </div>
              <div class="color-item">
                <label>错误色</label>
                <el-color-picker v-model="theme.colors!.error" />
              </div>
              <div class="color-item">
                <label>信息色</label>
                <el-color-picker v-model="theme.colors!.info" />
              </div>
            </div>
          </div>
          
          <div class="theme-section">
            <h4>背景色彩</h4>
            <div class="color-grid">
              <div class="color-item">
                <label>页面背景</label>
                <el-color-picker v-model="theme.colors!.background" />
              </div>
              <div class="color-item">
                <label>内容背景</label>
                <el-color-picker v-model="theme.colors!.surface" />
              </div>
              <div class="color-item">
                <label>侧边栏背景</label>
                <el-color-picker v-model="theme.colors!.sidebar" />
              </div>
              <div class="color-item">
                <label>头部背景</label>
                <el-color-picker v-model="theme.colors!.header" />
              </div>
            </div>
          </div>
          
          <div class="theme-section">
            <h4>文本色彩</h4>
            <div class="color-grid">
              <div class="color-item">
                <label>主文本</label>
                <el-color-picker v-model="theme.colors!.textPrimary" />
              </div>
              <div class="color-item">
                <label>次要文本</label>
                <el-color-picker v-model="theme.colors!.textSecondary" />
              </div>
              <div class="color-item">
                <label>禁用文本</label>
                <el-color-picker v-model="theme.colors!.textDisabled" />
              </div>
              <div class="color-item">
                <label>链接色</label>
                <el-color-picker v-model="theme.colors!.link" />
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 组件样式 -->
        <el-tab-pane label="组件样式" name="components">
          <div class="theme-section">
            <h4>按钮样式</h4>
            <div class="setting-item">
              <label>圆角大小</label>
              <el-slider
                v-model="theme.components!.button!.borderRadius"
                :min="0"
                :max="20"
                :step="1"
                show-input
              />
            </div>
            
            <div class="setting-item">
              <label>按钮高度</label>
              <el-slider
                v-model="theme.components!.button!.height"
                :min="28"
                :max="48"
                :step="2"
                show-input
              />
            </div>
          </div>
          
          <div class="theme-section">
            <h4>卡片样式</h4>
            <div class="setting-item">
              <label>圆角大小</label>
              <el-slider
                v-model="theme.components!.card!.borderRadius"
                :min="0"
                :max="20"
                :step="1"
                show-input
              />
            </div>
            
            <div class="setting-item">
              <label>阴影强度</label>
              <el-radio-group v-model="theme.components!.card!.shadow">
                <el-radio label="none">无阴影</el-radio>
                <el-radio label="small">轻微</el-radio>
                <el-radio label="medium">中等</el-radio>
                <el-radio label="large">强烈</el-radio>
              </el-radio-group>
            </div>
          </div>
          
          <div class="theme-section">
            <h4>表格样式</h4>
            <div class="setting-item">
              <label>斑马纹</label>
              <el-switch v-model="theme.components!.table!.stripe" />
            </div>
            
            <div class="setting-item">
              <label>边框</label>
              <el-switch v-model="theme.components!.table!.border" />
            </div>
            
            <div class="setting-item">
              <label>行高</label>
              <el-radio-group v-model="theme.components!.table!.size">
                <el-radio label="small">紧凑</el-radio>
                <el-radio label="default">默认</el-radio>
                <el-radio label="large">宽松</el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 预设主题 -->
        <el-tab-pane label="预设主题" name="presets">
          <div class="preset-themes">
            <div
              v-for="preset in presetThemes"
              :key="preset.name"
              class="preset-item"
              :class="{ active: currentPreset === preset.name }"
              @click="applyPreset(preset)"
            >
              <div class="preset-preview">
                <div class="preview-header" :style="{ backgroundColor: preset.primaryColor }"></div>
                <div class="preview-sidebar" :style="{ backgroundColor: preset.secondaryColor }"></div>
                <div class="preview-content" :style="{ backgroundColor: '#ffffff' }"></div>
              </div>
              <div class="preset-info">
                <h5>{{ preset.label }}</h5>
                <p>{{ preset.description }}</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 实时预览 -->
    <div class="preview-section" v-if="showPreview">
      <h4>实时预览</h4>
      <div class="preview-container" :style="previewStyles">
        <div class="preview-header">
          <div class="preview-logo">Logo</div>
          <div class="preview-nav">
            <span>首页</span>
            <span>文档</span>
            <span>API</span>
          </div>
        </div>
        <div class="preview-body">
          <div class="preview-sidebar">
            <div class="sidebar-item active">概述</div>
            <div class="sidebar-item">快速开始</div>
            <div class="sidebar-item">API参考</div>
          </div>
          <div class="preview-content">
            <h3>文档标题</h3>
            <p>这是一段示例文本，用于展示当前主题的效果。</p>
            <div class="preview-button" :style="buttonStyles">按钮示例</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 导入文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  RefreshLeft,
  Download,
  Upload
} from '@element-plus/icons-vue'
import type { DocTheme } from '@/types'

interface Props {
  modelValue: DocTheme
  showPreview?: boolean
}

interface Emits {
  'update:modelValue': [value: DocTheme]
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true
})

const emit = defineEmits<Emits>()

const activeTab = ref('basic')
const currentPreset = ref('default')
const fileInput = ref<HTMLInputElement>()

const theme = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 预设主题
const presetThemes = [
  {
    name: 'default',
    label: '默认主题',
    description: '简洁清爽的默认主题',
    primaryColor: '#409EFF',
    secondaryColor: '#67C23A',
    fontFamily: 'system',
    layout: {
      type: 'sidebar' as const
    },
    codeTheme: 'light' as const
  },
  {
    name: 'dark',
    label: '深色主题',
    description: '护眼的深色主题',
    primaryColor: '#409EFF',
    secondaryColor: '#67C23A',
    fontFamily: 'system',
    layout: {
      type: 'sidebar' as const
    },
    codeTheme: 'dark' as const
  },
  {
    name: 'minimal',
    label: '极简主题',
    description: '极简风格的主题',
    primaryColor: '#000000',
    secondaryColor: '#52c41a',
    fontFamily: 'system',
    layout: {
      type: 'topbar' as const
    },
    codeTheme: 'light' as const
  }
]

// 计算预览样式
const previewStyles = computed(() => ({
  backgroundColor: '#ffffff',
  color: '#303133',
  fontFamily: theme.value.fontFamily === 'system' ? 'system-ui' : theme.value.fontFamily,
  fontSize: '14px',
  lineHeight: '1.5'
}))

const buttonStyles = computed(() => ({
  backgroundColor: theme.value.primaryColor,
  borderRadius: '4px',
  height: '32px',
  color: '#ffffff'
}))

// 应用预设主题
const applyPreset = (preset: any) => {
  currentPreset.value = preset.name
  theme.value = { ...preset }
  ElMessage.success(`已应用${preset.label}`)
}

// 重置主题
const resetTheme = () => {
  applyPreset(presetThemes[0])
}

// 导出主题
const exportTheme = () => {
  const themeData = JSON.stringify(theme.value, null, 2)
  const blob = new Blob([themeData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'theme.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('主题已导出')
}

// 导入主题
const importTheme = () => {
  fileInput.value?.click()
}

const handleFileImport = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const themeData = JSON.parse(e.target?.result as string)
      theme.value = themeData
      currentPreset.value = 'custom'
      ElMessage.success('主题导入成功')
    } catch (error) {
      ElMessage.error('主题文件格式错误')
    }
  }
  reader.readAsText(file)
}

// 监听主题变化
watch(
  theme,
  () => {
    // 检查是否匹配预设主题
    const matchedPreset = presetThemes.find(preset => 
      preset.primaryColor === theme.value.primaryColor &&
      preset.secondaryColor === theme.value.secondaryColor &&
      preset.fontFamily === theme.value.fontFamily &&
      preset.layout.type === theme.value.layout.type &&
      preset.codeTheme === theme.value.codeTheme
    )
    currentPreset.value = matchedPreset?.name || 'custom'
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.theme-customizer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.customizer-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

.customizer-content {
  flex: 1;
  overflow: hidden;
}

.theme-tabs {
  height: 100%;
  
  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow-y: auto;
    padding: 20px;
  }
}

.theme-section {
  margin-bottom: 32px;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  label {
    width: 100px;
    font-size: 14px;
    color: #606266;
    margin-right: 16px;
  }
  
  .el-radio-group,
  .el-select,
  .el-slider {
    flex: 1;
  }
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.color-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  
  label {
    font-size: 14px;
    color: #606266;
  }
}

.preset-themes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preset-item {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: #409EFF;
  }
  
  &.active {
    border-color: #409EFF;
    background: #f0f9ff;
  }
}

.preset-preview {
  position: relative;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
}

.preview-header {
  height: 20px;
  width: 100%;
}

.preview-sidebar {
  position: absolute;
  left: 0;
  top: 20px;
  width: 30%;
  height: 60px;
}

.preview-content {
  position: absolute;
  right: 0;
  top: 20px;
  width: 70%;
  height: 60px;
}

.preset-info {
  h5 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 12px;
    color: #909399;
  }
}

.preview-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
  }
}

.preview-container {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  height: 200px;
}

.preview-header {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-logo {
  font-weight: bold;
}

.preview-nav {
  display: flex;
  gap: 16px;
  
  span {
    cursor: pointer;
    
    &:hover {
      opacity: 0.7;
    }
  }
}

.preview-body {
  display: flex;
  height: calc(100% - 40px);
}

.preview-sidebar {
  width: 200px;
  padding: 16px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.sidebar-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  
  &.active {
    background: rgba(64, 158, 255, 0.1);
    color: #409EFF;
  }
}

.preview-content {
  flex: 1;
  padding: 16px;
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
  }
  
  p {
    margin: 0 0 16px 0;
    line-height: 1.6;
  }
}

.preview-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.3s;
  
  &:hover {
    opacity: 0.8;
  }
}
</style>