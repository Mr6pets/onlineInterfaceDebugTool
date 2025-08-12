<template>
  <div class="settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">设置</h1>
        <p class="page-description">管理工作空间设置和个人偏好</p>
      </div>
    </div>

    <div class="settings-container">
      <!-- 侧边导航 -->
      <div class="settings-sidebar">
        <nav class="settings-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['nav-item', { active: activeTab === tab.id }]"
          >
            <component :is="tab.icon" class="w-5 h-5 mr-3" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- 设置内容 -->
      <div class="settings-content">
        <!-- 工作空间设置 -->
        <div v-if="activeTab === 'workspace'" class="settings-section">
          <div class="section-header">
            <h2 class="section-title">工作空间设置</h2>
            <p class="section-description">配置当前工作空间的基本信息和行为</p>
          </div>

          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">工作空间名称</label>
              <input 
                v-model="workspaceSettings.name"
                type="text" 
                class="form-input"
                placeholder="输入工作空间名称"
              />
            </div>

            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea 
                v-model="workspaceSettings.description"
                class="form-textarea"
                placeholder="输入工作空间描述"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">默认环境</label>
              <select v-model="workspaceSettings.defaultEnvironment" class="form-select">
                <option value="">选择默认环境</option>
                <option v-for="env in environments" :key="env.id" :value="env.id">
                  {{ env.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input 
                    v-model="workspaceSettings.autoSave"
                    type="checkbox" 
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">自动保存请求</span>
                </label>
                <p class="checkbox-description">自动保存API请求的修改</p>
              </div>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input 
                    v-model="workspaceSettings.enableHistory"
                    type="checkbox" 
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">启用历史记录</span>
                </label>
                <p class="checkbox-description">记录API请求的执行历史</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">历史记录保留天数</label>
              <input 
                v-model.number="workspaceSettings.historyRetentionDays"
                type="number" 
                min="1"
                max="365"
                class="form-input"
                :disabled="!workspaceSettings.enableHistory"
              />
            </div>
          </div>
        </div>

        <!-- 个人偏好 -->
        <div v-if="activeTab === 'preferences'" class="settings-section">
          <div class="section-header">
            <h2 class="section-title">个人偏好</h2>
            <p class="section-description">自定义您的使用体验</p>
          </div>

          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">主题</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input 
                    v-model="preferences.theme"
                    type="radio" 
                    value="light"
                    class="radio-input"
                  />
                  <span class="radio-text">浅色主题</span>
                </label>
                <label class="radio-label">
                  <input 
                    v-model="preferences.theme"
                    type="radio" 
                    value="dark"
                    class="radio-input"
                  />
                  <span class="radio-text">深色主题</span>
                </label>
                <label class="radio-label">
                  <input 
                    v-model="preferences.theme"
                    type="radio" 
                    value="auto"
                    class="radio-input"
                  />
                  <span class="radio-text">跟随系统</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">语言</label>
              <select v-model="preferences.language" class="form-select">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">字体大小</label>
              <select v-model="preferences.fontSize" class="form-select">
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input 
                    v-model="preferences.enableNotifications"
                    type="checkbox" 
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">启用通知</span>
                </label>
                <p class="checkbox-description">接收重要事件的桌面通知</p>
              </div>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input 
                    v-model="preferences.enableSounds"
                    type="checkbox" 
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">启用声音</span>
                </label>
                <p class="checkbox-description">播放操作反馈声音</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">默认请求超时时间（秒）</label>
              <input 
                v-model.number="preferences.defaultTimeout"
                type="number" 
                min="1"
                max="300"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- 安全设置 -->
        <div v-if="activeTab === 'security'" class="settings-section">
          <div class="section-header">
            <h2 class="section-title">安全设置</h2>
            <p class="section-description">管理账户安全和隐私设置</p>
          </div>

          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">当前密码</label>
              <input 
                v-model="securitySettings.currentPassword"
                type="password" 
                class="form-input"
                placeholder="输入当前密码"
              />
            </div>

            <div class="form-group">
              <label class="form-label">新密码</label>
              <input 
                v-model="securitySettings.newPassword"
                type="password" 
                class="form-input"
                placeholder="输入新密码"
              />
            </div>

            <div class="form-group">
              <label class="form-label">确认新密码</label>
              <input 
                v-model="securitySettings.confirmPassword"
                type="password" 
                class="form-input"
                placeholder="再次输入新密码"
              />
            </div>

            <div class="form-group">
              <button 
                @click="changePassword"
                :disabled="!canChangePassword"
                class="btn btn-primary"
              >
                更改密码
              </button>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input 
                    v-model="securitySettings.twoFactorAuth"
                    type="checkbox" 
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">启用双因素认证</span>
                </label>
                <p class="checkbox-description">为您的账户添加额外的安全保护</p>
              </div>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input 
                    v-model="securitySettings.sessionTimeout"
                    type="checkbox" 
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">自动登出</span>
                </label>
                <p class="checkbox-description">长时间不活动时自动登出</p>
              </div>
            </div>

            <div class="form-group" v-if="securitySettings.sessionTimeout">
              <label class="form-label">自动登出时间（分钟）</label>
              <select v-model="securitySettings.sessionTimeoutMinutes" class="form-select">
                <option value="15">15分钟</option>
                <option value="30">30分钟</option>
                <option value="60">1小时</option>
                <option value="120">2小时</option>
                <option value="480">8小时</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div v-if="activeTab === 'data'" class="settings-section">
          <div class="section-header">
            <h2 class="section-title">数据管理</h2>
            <p class="section-description">导入、导出和备份您的数据</p>
          </div>

          <div class="settings-form">
            <div class="data-section">
              <h3 class="data-section-title">导出数据</h3>
              <p class="data-section-description">将您的工作空间数据导出为文件</p>
              <div class="data-actions">
                <button @click="exportData('json')" class="btn btn-secondary">
                  <Download class="w-4 h-4 mr-2" />
                  导出为 JSON
                </button>
                <button @click="exportData('postman')" class="btn btn-secondary">
                  <Download class="w-4 h-4 mr-2" />
                  导出为 Postman
                </button>
              </div>
            </div>

            <div class="data-section">
              <h3 class="data-section-title">导入数据</h3>
              <p class="data-section-description">从文件导入工作空间数据</p>
              <div class="data-actions">
                <input 
                  ref="fileInput"
                  type="file" 
                  accept=".json"
                  @change="handleFileImport"
                  class="hidden"
                />
                <button @click="$refs.fileInput?.click()" class="btn btn-secondary">
                  <Upload class="w-4 h-4 mr-2" />
                  选择文件导入
                </button>
              </div>
            </div>

            <div class="data-section">
              <h3 class="data-section-title">清理数据</h3>
              <p class="data-section-description">清理不需要的数据以释放空间</p>
              <div class="data-actions">
                <button @click="clearHistory" class="btn btn-warning">
                  <Trash2 class="w-4 h-4 mr-2" />
                  清理历史记录
                </button>
                <button @click="clearCache" class="btn btn-warning">
                  <Trash2 class="w-4 h-4 mr-2" />
                  清理缓存
                </button>
              </div>
            </div>

            <div class="data-section danger-section">
              <h3 class="data-section-title">危险操作</h3>
              <p class="data-section-description">这些操作不可逆，请谨慎操作</p>
              <div class="data-actions">
                <button @click="resetWorkspace" class="btn btn-danger">
                  <AlertTriangle class="w-4 h-4 mr-2" />
                  重置工作空间
                </button>
                <button @click="deleteAccount" class="btn btn-danger">
                  <AlertTriangle class="w-4 h-4 mr-2" />
                  删除账户
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div v-if="activeTab === 'about'" class="settings-section">
          <div class="section-header">
            <h2 class="section-title">关于</h2>
            <p class="section-description">应用信息和帮助</p>
          </div>

          <div class="about-content">
            <div class="app-info">
              <div class="app-logo">
                <div class="logo-placeholder">
                  <Zap class="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <div class="app-details">
                <h3 class="app-name">在线接口调试工具</h3>
                <p class="app-version">版本 {{ appInfo.version }}</p>
                <p class="app-description">{{ appInfo.description }}</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <h4 class="info-title">构建信息</h4>
                <p class="info-value">{{ appInfo.buildDate }}</p>
              </div>
              <div class="info-item">
                <h4 class="info-title">技术栈</h4>
                <p class="info-value">Vue 3 + TypeScript + Vite</p>
              </div>
              <div class="info-item">
                <h4 class="info-title">许可证</h4>
                <p class="info-value">MIT License</p>
              </div>
              <div class="info-item">
                <h4 class="info-title">开发者</h4>
                <p class="info-value">API Debug Team</p>
              </div>
            </div>

            <div class="help-links">
              <a href="#" class="help-link">
                <HelpCircle class="w-4 h-4 mr-2" />
                帮助文档
              </a>
              <a href="#" class="help-link">
                <MessageCircle class="w-4 h-4 mr-2" />
                反馈建议
              </a>
              <a href="#" class="help-link">
                <Github class="w-4 h-4 mr-2" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div v-if="activeTab !== 'about'" class="settings-footer">
          <div class="footer-actions">
            <button @click="resetSettings" class="btn btn-secondary">
              重置
            </button>
            <button @click="saveSettings" class="btn btn-primary">
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Setting as SettingsIcon, User, Lock as Shield, Coin as Database, InfoFilled as Info,
  Download, Upload, Delete as Trash2, Warning as AlertTriangle, Lightning as Zap, 
  QuestionFilled as HelpCircle, ChatDotRound as MessageCircle, Link as Github
} from '@element-plus/icons-vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useEnvironmentStore } from '@/stores/environment'

const workspaceStore = useWorkspaceStore()
const environmentStore = useEnvironmentStore()

// 标签页配置
const tabs = [
  { id: 'workspace', label: '工作空间', icon: SettingsIcon },
  { id: 'preferences', label: '个人偏好', icon: User },
  { id: 'security', label: '安全设置', icon: Shield },
  { id: 'data', label: '数据管理', icon: Database },
  { id: 'about', label: '关于', icon: Info }
]

// 响应式数据
const activeTab = ref('workspace')
const fileInput = ref<HTMLInputElement>()

// 工作空间设置
const workspaceSettings = ref({
  name: '',
  description: '',
  defaultEnvironment: '',
  autoSave: true,
  enableHistory: true,
  historyRetentionDays: 30
})

// 个人偏好
const preferences = ref({
  theme: 'light',
  language: 'zh-CN',
  fontSize: 'medium',
  enableNotifications: true,
  enableSounds: false,
  defaultTimeout: 30
})

// 安全设置
const securitySettings = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorAuth: false,
  sessionTimeout: false,
  sessionTimeoutMinutes: 30
})

// 应用信息
const appInfo = ref({
  version: '2.0.0',
  description: '专业的API接口调试和测试工具，支持团队协作和批量测试',
  buildDate: new Date().toLocaleDateString('zh-CN')
})

// 计算属性
const environments = computed(() => environmentStore.environments)

const canChangePassword = computed(() => {
  return securitySettings.value.currentPassword && 
         securitySettings.value.newPassword && 
         securitySettings.value.confirmPassword &&
         securitySettings.value.newPassword === securitySettings.value.confirmPassword &&
         securitySettings.value.newPassword.length >= 6
})

// 方法
const loadSettings = () => {
  // 加载工作空间设置
  const currentWorkspace = workspaceStore.currentWorkspace
  if (currentWorkspace) {
    workspaceSettings.value = {
      name: currentWorkspace.name,
      description: currentWorkspace.description || '',
      defaultEnvironment: currentWorkspace.defaultEnvironment || '',
      autoSave: currentWorkspace.settings?.autoSave ?? true,
      enableHistory: currentWorkspace.settings?.enableHistory ?? true,
      historyRetentionDays: currentWorkspace.settings?.historyRetentionDays ?? 30
    }
  }

  // 加载个人偏好
  const savedPreferences = localStorage.getItem('user_preferences')
  if (savedPreferences) {
    try {
      Object.assign(preferences.value, JSON.parse(savedPreferences))
    } catch (e) {
      console.error('Failed to load preferences:', e)
    }
  }

  // 加载安全设置
  const savedSecurity = localStorage.getItem('security_settings')
  if (savedSecurity) {
    try {
      const security = JSON.parse(savedSecurity)
      securitySettings.value.twoFactorAuth = security.twoFactorAuth ?? false
      securitySettings.value.sessionTimeout = security.sessionTimeout ?? false
      securitySettings.value.sessionTimeoutMinutes = security.sessionTimeoutMinutes ?? 30
    } catch (e) {
      console.error('Failed to load security settings:', e)
    }
  }
}

const saveSettings = async () => {
  try {
    // 保存工作空间设置
    if (workspaceStore.currentWorkspace) {
      await workspaceStore.updateWorkspaceSettings(workspaceStore.currentWorkspace.id, {
        name: workspaceSettings.value.name,
        description: workspaceSettings.value.description,
        defaultEnvironment: workspaceSettings.value.defaultEnvironment,
        autoSave: workspaceSettings.value.autoSave,
        enableHistory: workspaceSettings.value.enableHistory,
        historyRetentionDays: workspaceSettings.value.historyRetentionDays
      })
    }

    // 保存个人偏好
    localStorage.setItem('user_preferences', JSON.stringify(preferences.value))

    // 保存安全设置
    const securityData = {
      twoFactorAuth: securitySettings.value.twoFactorAuth,
      sessionTimeout: securitySettings.value.sessionTimeout,
      sessionTimeoutMinutes: securitySettings.value.sessionTimeoutMinutes
    }
    localStorage.setItem('security_settings', JSON.stringify(securityData))

    // 应用主题
    applyTheme(preferences.value.theme)

    alert('设置已保存')
  } catch (error) {
    console.error('Save settings error:', error)
    alert('保存设置失败')
  }
}

const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？')) {
    loadSettings()
  }
}

const applyTheme = (theme: string) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // auto - 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

const changePassword = async () => {
  if (!canChangePassword.value) return
  
  try {
    // 模拟密码更改API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 清空密码字段
    securitySettings.value.currentPassword = ''
    securitySettings.value.newPassword = ''
    securitySettings.value.confirmPassword = ''
    
    alert('密码已成功更改')
  } catch (error) {
    console.error('Change password error:', error)
    alert('密码更改失败')
  }
}

const exportData = async (format: string) => {
  try {
    const data = await workspaceStore.exportData(format)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workspace-export-${format}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export data error:', error)
    alert('导出数据失败')
  }
}

const handleFileImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await workspaceStore.importData(data)
    alert('数据导入成功')
  } catch (error) {
    console.error('Import data error:', error)
    alert('数据导入失败')
  }
}

const clearHistory = async () => {
  if (confirm('确定要清理所有历史记录吗？此操作不可撤销。')) {
    try {
      // 清理历史记录逻辑
      localStorage.removeItem('request_history')
      alert('历史记录已清理')
    } catch (error) {
      console.error('Clear history error:', error)
      alert('清理历史记录失败')
    }
  }
}

const clearCache = async () => {
  if (confirm('确定要清理所有缓存吗？')) {
    try {
      // 清理缓存逻辑
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'))
      keys.forEach(key => localStorage.removeItem(key))
      alert('缓存已清理')
    } catch (error) {
      console.error('Clear cache error:', error)
      alert('清理缓存失败')
    }
  }
}

const resetWorkspace = async () => {
  if (confirm('确定要重置工作空间吗？这将删除所有数据，此操作不可撤销！')) {
    if (confirm('请再次确认：这将永久删除所有工作空间数据！')) {
      try {
        await workspaceStore.clearWorkspaceData()
        alert('工作空间已重置')
        // 重新加载页面
        window.location.reload()
      } catch (error) {
        console.error('Reset workspace error:', error)
        alert('重置工作空间失败')
      }
    }
  }
}

const deleteAccount = async () => {
  if (confirm('确定要删除账户吗？这将永久删除您的所有数据，此操作不可撤销！')) {
    if (confirm('请再次确认：这将永久删除您的账户和所有数据！')) {
      try {
        // 删除账户逻辑
        alert('账户删除功能暂未实现')
      } catch (error) {
        console.error('Delete account error:', error)
        alert('删除账户失败')
      }
    }
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  environmentStore.loadEnvironments()
})
</script>

<style scoped>
.settings {
  @apply p-8 max-w-7xl mx-auto;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 25%, #f0f9ff 50%, #e0f2fe 75%, #f8fafc 100%);
  min-height: calc(100vh - 68px);
  position: relative;
  overflow-x: hidden;
}

.settings::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.settings > * {
  position: relative;
  z-index: 1;
}

.page-header {
  @apply mb-16;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(226, 232, 240, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(59, 130, 246, 0.05);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%);
  pointer-events: none;
}

.page-header > * {
  position: relative;
  z-index: 1;
}

.page-title {
  @apply text-5xl font-black mb-6;
  background: linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 2px;
  opacity: 0.7;
}

.page-description {
  @apply text-xl text-slate-700 font-medium;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  opacity: 0.9;
}

.settings-container {
  @apply flex gap-12;
  align-items: flex-start;
}

.settings-sidebar {
  @apply w-80 flex-shrink-0;
  position: sticky;
  top: 32px;
}

.settings-nav {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e0f2fe 100%);
  @apply rounded-2xl shadow-2xl border border-slate-200 p-6;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(226, 232, 240, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.settings-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.settings-nav > * {
  position: relative;
  z-index: 1;
}

.nav-item {
  @apply w-full flex items-center px-6 py-5 text-left rounded-xl transition-all duration-500 mb-3;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  cursor: pointer;
  font-weight: 500;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 8px;
  width: 4px;
  height: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 2px;
  transition: height 0.3s ease;
  transform: translateY(-50%);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(6px) translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(59, 130, 246, 0.2);
}

.nav-item:hover::after {
  height: 24px;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #8b5cf6 100%);
  @apply text-white font-bold;
  box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4), 0 6px 20px rgba(139, 92, 246, 0.2);
  transform: translateX(8px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.2);
}

.nav-item.active::after {
  height: 32px;
  background: rgba(255, 255, 255, 0.8);
  width: 5px;
}

.nav-item.active svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.settings-content {
  @apply flex-1;
}

.settings-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e0f2fe 100%);
  @apply rounded-3xl shadow-2xl border border-slate-200 p-10;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(226, 232, 240, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.settings-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.settings-section > * {
  position: relative;
  z-index: 1;
}

.settings-section:hover {
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 12px 40px rgba(59, 130, 246, 0.1);
  transform: translateY(-4px) scale(1.01);
  border-color: rgba(59, 130, 246, 0.2);
}

.section-header {
  @apply mb-8 pb-6;
  border-bottom: 2px solid rgba(226, 232, 240, 0.8);
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 1px;
}

.section-title {
  @apply text-2xl font-bold mb-3;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  @apply text-slate-600 text-lg;
}

.settings-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-semibold text-gray-800 mb-3;
  letter-spacing: 0.5px;
  position: relative;
}

.form-label::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 1px;
  opacity: 0.6;
}

.form-input {
  @apply w-full px-5 py-4 border border-slate-300 rounded-xl;
  background: rgba(248, 250, 252, 0.9);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(226, 232, 240, 0.6);
  font-size: 15px;
  font-weight: 500;
}

.form-input:focus {
  @apply ring-2 ring-blue-500 border-transparent;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(139, 92, 246, 0.1);
  transform: translateY(-2px) scale(1.01);
  outline: none;
}

.form-select {
  @apply w-full px-5 py-4 border border-slate-300 rounded-xl;
  background: rgba(248, 250, 252, 0.9);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(226, 232, 240, 0.6);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.form-select:focus {
  @apply ring-2 ring-blue-500 border-transparent;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(139, 92, 246, 0.1);
  transform: translateY(-2px) scale(1.01);
  outline: none;
}

.form-textarea {
  @apply w-full px-5 py-4 border border-slate-300 rounded-xl resize-none;
  background: rgba(248, 250, 252, 0.9);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(226, 232, 240, 0.6);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.6;
}

.form-textarea:focus {
  @apply ring-2 ring-blue-500 border-transparent;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(139, 92, 246, 0.1);
  transform: translateY(-2px) scale(1.01);
  outline: none;
}

.checkbox-group {
  @apply space-y-1;
}

.checkbox-label {
  @apply flex items-center;
}

.checkbox-input {
  @apply mr-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500;
  width: 18px;
  height: 18px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.checkbox-input:checked {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.checkbox-text {
  @apply text-base font-semibold text-gray-800;
  cursor: pointer;
  transition: color 0.3s ease;
}

.checkbox-label:hover .checkbox-text {
  color: #3b82f6;
}

.checkbox-description {
  @apply text-sm text-gray-600 ml-8 mt-1;
  font-style: italic;
  line-height: 1.5;
}

.radio-group {
  @apply space-y-2;
}

.radio-label {
  @apply flex items-center;
}

.radio-input {
  @apply mr-3 border-gray-300 text-blue-600 focus:ring-blue-500;
}

.radio-text {
  @apply text-sm text-gray-700;
}

.btn {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  border: 1px solid transparent;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  @apply text-white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: rgba(248, 250, 252, 0.8);
  @apply text-slate-700;
  border-color: rgba(226, 232, 240, 0.8);
}

.btn-secondary:hover {
  background: rgba(241, 245, 249, 0.9);
  border-color: rgba(203, 213, 225, 0.8);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  @apply text-white;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.btn-warning:hover {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  @apply text-white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #f87171 0%, #b91c1c 100%);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.data-section {
  @apply border border-slate-200 rounded-xl p-6 space-y-4;
  background: rgba(248, 250, 252, 0.5);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.data-section:hover {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.data-section-title {
  @apply text-xl font-semibold text-slate-900;
}

.data-section-description {
  @apply text-base text-slate-600;
}

.data-actions {
  @apply flex gap-3;
}

.danger-section {
  @apply border-red-200 bg-red-50;
}

.about-content {
  @apply space-y-8;
}

.app-info {
  @apply flex items-center space-x-4;
}

.app-logo {
  @apply flex-shrink-0;
}

.logo-placeholder {
  @apply w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center;
}

.app-details {
  @apply flex-1;
}

.app-name {
  @apply text-xl font-semibold text-gray-900;
}

.app-version {
  @apply text-sm text-gray-600 mb-2;
}

.app-description {
  @apply text-gray-700;
}

.info-grid {
  @apply grid grid-cols-2 gap-4;
}

.info-item {
  @apply bg-gray-50 rounded-lg p-4;
}

.info-title {
  @apply text-sm font-medium text-gray-700 mb-1;
}

.info-value {
  @apply text-gray-900;
}

.help-links {
  @apply flex gap-4;
}

.help-link {
  @apply flex items-center text-blue-600 hover:text-blue-700 transition-colors;
}

.settings-footer {
  @apply mt-12 pt-8;
  border-top: 2px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.footer-actions {
  @apply flex justify-end gap-4;
}

.hidden {
  @apply sr-only;
}
</style>