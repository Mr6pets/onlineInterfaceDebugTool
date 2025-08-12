<template>
  <div class="app-header">
    <div class="header-left">
      <!-- 面包屑导航 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/workspace' }">工作空间</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentWorkspace">{{ currentWorkspace.name }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="breadcrumbItems.length > 0" v-for="item in breadcrumbItems" :key="item.path" :to="item.path">
          {{ item.label }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="header-center">
      <!-- 全局搜索 -->
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索API、集合、环境..."
          prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
          @focus="showSearchSuggestions = true"
          @blur="hideSearchSuggestions"
        />
        
        <!-- 搜索建议 -->
        <div v-if="showSearchSuggestions && searchSuggestions.length > 0" class="search-suggestions">
          <div 
            v-for="suggestion in searchSuggestions" 
            :key="suggestion.id"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)"
          >
            <el-icon class="suggestion-icon">
              <component :is="suggestion.icon" />
            </el-icon>
            <div class="suggestion-content">
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-desc">{{ suggestion.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="header-right">
      <!-- 快捷操作 -->
      <div class="quick-actions">
        <el-tooltip content="新建请求" placement="bottom">
          <el-button type="primary" size="small" @click="createNewRequest">
            <el-icon><Plus /></el-icon>
            新建
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="导入" placement="bottom">
          <el-button text @click="showImportDialog">
            <el-icon><Upload /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="同步" placement="bottom">
          <el-button text @click="syncData" :loading="syncing">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      
      <!-- 通知中心 -->
      <el-dropdown @command="handleNotificationAction">
        <el-badge :value="unreadNotifications" :hidden="unreadNotifications === 0">
          <el-button text class="notification-btn">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>
        <template #dropdown>
          <el-dropdown-menu class="notification-menu">
            <div class="notification-header">
              <span>通知中心</span>
              <el-button text size="small" @click="markAllAsRead">全部已读</el-button>
            </div>
            <el-dropdown-item 
              v-for="notification in recentNotifications" 
              :key="notification.id"
              :command="notification.id"
              :class="{ unread: !notification.read }"
            >
              <div class="notification-item">
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item command="view-all" divided>
              <div class="view-all">查看全部通知</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <!-- 用户菜单 -->
      <el-dropdown @command="handleUserMenu">
        <div class="user-info">
          <el-avatar :size="32" :src="currentUser?.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-details">
            <span class="user-name">{{ currentUser?.name || '用户' }}</span>
            <span class="user-role">{{ getRoleLabel(currentUser?.role) }}</span>
          </div>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item command="preferences">
              <el-icon><Setting /></el-icon>
              偏好设置
            </el-dropdown-item>
            <el-dropdown-item command="team" v-if="canManageTeam">
              <el-icon><Avatar /></el-icon>
              团队管理
            </el-dropdown-item>
            <el-dropdown-item command="help">
              <el-icon><QuestionFilled /></el-icon>
              帮助中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Setting, 
  User, 
  ArrowDown, 
  SwitchButton,
  Plus,
  Upload,
  Refresh,
  Bell,
  Avatar,
  QuestionFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkspaceStore } from '@/stores/workspace'
// 简单的时间格式化函数
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 临时本地类型定义
interface UserType {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  status?: string
  createdAt?: Date
  updatedAt?: Date
  preferences?: {
    theme: string
    language: string
    notifications: {
      email: boolean
      push: boolean
      desktop: boolean
    }
    editor: {
      fontSize: number
      tabSize: number
      wordWrap: boolean
      minimap: boolean
    }
  }
}

type UserRole = 'admin' | 'member' | 'viewer' | 'owner'



interface SearchSuggestion {
  id: string
  title: string
  description: string
  icon: string
  type: 'api' | 'collection' | 'environment'
}

interface Notification {
  id: string
  title: string
  content: string
  read: boolean
  createdAt: Date
}

interface BreadcrumbItem {
  label: string
  path: string
}

const router = useRouter()
const route = useRoute()
const workspaceStore = useWorkspaceStore()

// 当前用户信息（模拟数据）
const currentUser = ref<UserType>({
  id: 'user-1',
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: '',
  role: 'admin',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  preferences: {
    theme: 'light',
    language: 'zh-CN',
    notifications: {
      email: true,
      push: true,
      desktop: false
    },
    editor: {
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      minimap: true
    }
  }
})

// 当前工作空间
const currentWorkspace = computed(() => workspaceStore.currentWorkspace)

// 面包屑导航
const breadcrumbItems = computed(() => {
  const items: BreadcrumbItem[] = []
  const routeName = route.name as string
  
  if (routeName?.includes('collection')) {
    items.push({ label: 'API集合', path: '/collections' })
  } else if (routeName?.includes('environment')) {
    items.push({ label: '环境管理', path: '/environments' })
  } else if (routeName?.includes('history')) {
    items.push({ label: '历史记录', path: '/history' })
  } else if (routeName?.includes('team')) {
    items.push({ label: '团队协作', path: '/team' })
  }
  
  return items
})

// 搜索相关
const searchQuery = ref('')
const showSearchSuggestions = ref(false)
const searchSuggestions = ref<SearchSuggestion[]>([
  {
    id: '1',
    title: 'GET /api/users',
    description: '用户列表接口',
    icon: 'Document',
    type: 'api'
  },
  {
    id: '2',
    title: '用户管理集合',
    description: '包含用户相关的所有接口',
    icon: 'Folder',
    type: 'collection'
  },
  {
    id: '3',
    title: '生产环境',
    description: 'https://api.example.com',
    icon: 'DataAnalysis',
    type: 'environment'
  }
])

// 同步状态
const syncing = ref(false)

// 通知相关
const unreadNotifications = ref(3)
const recentNotifications = ref<Notification[]>([
  {
    id: '1',
    title: '团队成员邀请',
    content: '李四邀请您加入"前端开发"团队',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30分钟前
  },
  {
    id: '2',
    title: 'API测试完成',
    content: '批量测试"用户管理"已完成，成功率95%',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2小时前
  },
  {
    id: '3',
    title: '环境同步成功',
    content: '生产环境配置已同步到本地',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1天前
  }
])

// 权限检查
const canManageTeam = computed(() => {
  return currentUser.value?.role === 'admin' || currentUser.value?.role === 'owner'
})

// 搜索处理
const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  
  // 实现全局搜索逻辑
  router.push({
    name: 'search',
    query: { q: searchQuery.value }
  })
  showSearchSuggestions.value = false
}

const selectSuggestion = (suggestion: SearchSuggestion) => {
  searchQuery.value = suggestion.title
  showSearchSuggestions.value = false
  
  // 根据建议类型跳转到相应页面
  switch (suggestion.type) {
    case 'api':
      router.push(`/collections/${suggestion.id}`)
      break
    case 'collection':
      router.push(`/collections/${suggestion.id}`)
      break
    case 'environment':
      router.push(`/environments/${suggestion.id}`)
      break
  }
}

const hideSearchSuggestions = () => {
  setTimeout(() => {
    showSearchSuggestions.value = false
  }, 200)
}

// 快捷操作
const createNewRequest = () => {
  router.push('/collections/new')
}

const showImportDialog = () => {
  ElMessage.info('导入功能开发中...')
}

const syncData = async () => {
  syncing.value = true
  try {
    // 模拟同步操作
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('数据同步成功')
  } catch (error) {
    ElMessage.error('数据同步失败')
  } finally {
    syncing.value = false
  }
}

// 通知处理
const handleNotificationAction = (command: string) => {
  if (command === 'view-all') {
    router.push('/notifications')
  } else {
    // 处理特定通知
    const notification = recentNotifications.value.find(n => n.id === command)
    if (notification && !notification.read) {
      notification.read = true
      unreadNotifications.value--
    }
  }
}

const markAllAsRead = () => {
  recentNotifications.value.forEach(n => n.read = true)
  unreadNotifications.value = 0
  ElMessage.success('所有通知已标记为已读')
}

// 用户菜单处理
const handleUserMenu = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'preferences':
      router.push('/settings/preferences')
      break
    case 'team':
      router.push('/team')
      break
    case 'help':
      router.push('/help')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '退出确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        // 执行退出登录逻辑
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

// 获取角色标签
const getRoleLabel = (role?: UserRole) => {
  const roleMap = {
    owner: '所有者',
    admin: '管理员',
    member: '成员',
    viewer: '查看者'
  }
  return role ? roleMap[role] : '未知'
}



// 监听搜索输入，实时更新建议
watch(searchQuery, (newQuery) => {
  if (newQuery.trim()) {
    // 这里可以实现实时搜索建议的逻辑
    // 暂时使用模拟数据
  }
})

// 组件挂载时的初始化
onMounted(() => {
  // 初始化通知轮询等
})
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 32px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  z-index: 1000;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 0 0 20px 20px;
  margin: 0 12px;
  overflow: hidden;
}





.header-left {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.breadcrumb {
  font-size: 14px;
}

.breadcrumb :deep(.el-breadcrumb__item) {
  font-weight: 500;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  color: #606266;
}

.breadcrumb :deep(.el-breadcrumb__inner:hover) {
  color: #409eff;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 32px;
  position: relative;
}

.search-container {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 36px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%);
  border: 1px solid rgba(59, 130, 246, 0.15);
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(16px) saturate(180%);
  box-shadow: 
    0 8px 32px rgba(59, 130, 246, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(59, 130, 246, 0.05);
  position: relative;
  overflow: hidden;
}

.search-input :deep(.el-input__wrapper::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(59, 130, 246, 0.1) 50%, 
    transparent 100%);
  transition: left 0.6s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%,
    rgba(240, 249, 255, 0.95) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 
    0 16px 48px rgba(59, 130, 246, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  transform: translateY(-3px) scale(1.02);
}

.search-input :deep(.el-input__wrapper:hover::before) {
  left: 100%;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 1) 0%,
    rgba(240, 249, 255, 0.98) 100%);
  border-color: #3b82f6;
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.2),
    0 20px 60px rgba(59, 130, 246, 0.15),
    0 12px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  transform: translateY(-3px) scale(1.03);
}

.search-input :deep(.el-input__inner) {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
  font-weight: 400;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f5f7fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #f8f9fa;
}

.suggestion-icon {
  margin-right: 12px;
  color: #909399;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.suggestion-desc {
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  justify-content: flex-end;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-actions .el-button {
  border-radius: 16px;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(59, 130, 246, 0.15);
  position: relative;
  overflow: hidden;
  font-weight: 500;
}

.quick-actions .el-button--primary {
  background: linear-gradient(135deg, 
    #3b82f6 0%, 
    #2563eb 50%, 
    #1d4ed8 100%);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 
    0 8px 24px rgba(59, 130, 246, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.quick-actions .el-button--primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    transparent 100%);
  transition: left 0.6s ease;
}

.quick-actions .el-button.is-text {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(59, 130, 246, 0.1);
  color: #6b7280;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quick-actions .el-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 16px 40px rgba(59, 130, 246, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.quick-actions .el-button--primary:hover {
  background: linear-gradient(135deg, 
    #2563eb 0%, 
    #1d4ed8 50%, 
    #1e40af 100%);
  box-shadow: 
    0 16px 48px rgba(59, 130, 246, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.quick-actions .el-button--primary:hover::before {
  left: 100%;
}

.quick-actions .el-button.is-text:hover {
  background: rgba(255, 255, 255, 0.95);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}

.quick-actions .el-button:active {
  transform: translateY(-1px) scale(1.02);
  transition: all 0.1s ease;
}

.notification-btn {
  position: relative;
}

.notification-menu {
  width: 320px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  font-weight: 600;
  color: #303133;
}

.notification-item {
  padding: 0;
}

.notification-content {
  padding: 12px 16px;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.unread {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
}

.view-all {
  text-align: center;
  color: #409eff;
  font-weight: 500;
  padding: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(59, 130, 246, 0.15);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 252, 0.85) 100%);
  backdrop-filter: blur(16px) saturate(180%);
  box-shadow: 
    0 8px 32px rgba(59, 130, 246, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(59, 130, 246, 0.05);
  position: relative;
  overflow: hidden;
}

.user-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(59, 130, 246, 0.08) 50%, 
    transparent 100%);
  transition: left 0.6s ease;
}

.user-info:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%,
    rgba(240, 249, 255, 0.95) 100%);
  border-color: rgba(59, 130, 246, 0.25);
  box-shadow: 
    0 16px 48px rgba(59, 130, 246, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  transform: translateY(-3px) scale(1.02);
}

.user-info:hover::before {
  left: 100%;
}

.user-info:active {
  transform: translateY(-1px) scale(1.01);
  transition: all 0.1s ease;
}

.user-info :deep(.el-avatar) {
  border: 2px solid rgba(59, 130, 246, 0.2);
  box-shadow: 
    0 4px 16px rgba(59, 130, 246, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  background: linear-gradient(135deg, 
    #f8fafc 0%, 
    #e2e8f0 100%);
}

.user-info:hover :deep(.el-avatar) {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 
    0 8px 24px rgba(59, 130, 246, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.user-name {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.user-info:hover .user-name {
  color: #3b82f6;
}

.user-role {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.2;
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-info:hover .user-role {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.dropdown-icon {
  color: #9ca3af;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg) scale(1.1);
  color: #3b82f6;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .app-header {
    margin: 0 8px;
    padding: 0 24px;
  }
  
  .header-center {
    padding: 0 16px;
  }
  
  .search-container {
    max-width: 360px;
  }
  
  .quick-actions {
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
    height: 64px;
    margin: 0 4px;
    border-radius: 0 0 16px 16px;
  }
  
  .header-left,
  .header-right {
    min-width: auto;
  }
  
  .breadcrumb {
    display: none;
  }
  
  .search-container {
    max-width: 280px;
  }
  
  .user-details {
    display: none;
  }
  
  .user-info {
    padding: 10px 12px;
    gap: 8px;
  }
  
  .quick-actions {
    gap: 4px;
  }
  
  .quick-actions .el-button {
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 12px;
    height: 56px;
  }
  
  .header-center {
    padding: 0 8px;
  }
  
  .search-container {
    max-width: 200px;
  }
  
  .quick-actions .el-button span {
    display: none;
  }
  
  .quick-actions .el-button {
    padding: 8px;
    min-width: auto;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .app-header {
    background: linear-gradient(135deg, 
      rgba(31, 41, 55, 0.95) 0%, 
      rgba(17, 24, 39, 0.9) 25%,
      rgba(15, 23, 42, 0.85) 50%,
      rgba(30, 41, 59, 0.9) 75%,
      rgba(51, 65, 85, 0.95) 100%);
    border-bottom-color: rgba(59, 130, 246, 0.2);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 8px 24px rgba(0, 0, 0, 0.2),
      0 2px 8px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .search-input :deep(.el-input__wrapper) {
    background: linear-gradient(135deg, 
      rgba(55, 65, 81, 0.9) 0%,
      rgba(31, 41, 55, 0.85) 100%);
    border-color: rgba(59, 130, 246, 0.3);
    color: #f9fafb;
  }
  
  .search-input :deep(.el-input__wrapper:hover) {
    background: linear-gradient(135deg, 
      rgba(75, 85, 99, 0.95) 0%,
      rgba(55, 65, 81, 0.9) 100%);
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  .quick-actions .el-button.is-text {
    background: rgba(55, 65, 81, 0.8);
    color: #d1d5db;
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  .quick-actions .el-button.is-text:hover {
    background: rgba(75, 85, 99, 0.9);
    color: #60a5fa;
  }
  
  .user-info {
    background: linear-gradient(135deg, 
      rgba(55, 65, 81, 0.9) 0%,
      rgba(31, 41, 55, 0.85) 100%);
    border-color: rgba(59, 130, 246, 0.25);
  }
  
  .user-info:hover {
    background: linear-gradient(135deg, 
      rgba(75, 85, 99, 0.95) 0%,
      rgba(55, 65, 81, 0.9) 100%);
  }
  
  .user-name {
    color: #f9fafb;
  }
  
  .user-info:hover .user-name {
    color: #60a5fa;
  }
  
  .user-role {
    color: #d1d5db;
    background: rgba(59, 130, 246, 0.2);
  }
  
  .user-info:hover .user-role {
    background: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }
  
  .search-suggestions {
    background: #1f2937;
    border-color: #374151;
  }
  
  .suggestion-item:hover {
    background-color: #374151;
  }
}
</style>