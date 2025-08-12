<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">
          <el-icon size="20"><Setting /></el-icon>
        </div>
        <span v-if="!collapsed" class="logo-text">API Debug Tool</span>
      </div>
      <el-button 
        @click="$emit('toggle')" 
        text 
        class="toggle-btn"
        size="small"
      >
        <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
      </el-button>
    </div>
    
    <!-- 工作空间选择器 -->
    <div v-if="!collapsed" class="workspace-selector">
      <el-select 
        v-model="currentWorkspaceId" 
        placeholder="选择工作空间"
        size="small"
        style="width: 100%"
        @change="handleWorkspaceChange"
      >
        <el-option
          v-for="workspace in workspaces"
          :key="workspace.id"
          :label="workspace.name"
          :value="workspace.id"
        />
      </el-select>
    </div>
    
    <nav class="sidebar-nav">
      <!-- 主要功能区 -->
      <div class="nav-section">
        <div v-if="!collapsed" class="section-title">核心功能</div>
        <router-link 
          v-for="item in coreMenuItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActiveRoute(item.name) }"
        >
          <el-icon :size="16"><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed" class="nav-text">{{ item.label }}</span>
          <el-badge 
            v-if="item.badge && !collapsed" 
            :value="item.badge" 
            class="nav-badge"
          />
        </router-link>
      </div>
      
      <!-- 团队协作区 -->
      <div class="nav-section">
        <div v-if="!collapsed" class="section-title">团队协作</div>
        <router-link 
          v-for="item in teamMenuItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActiveRoute(item.name) }"
        >
          <el-icon :size="16"><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed" class="nav-text">{{ item.label }}</span>
        </router-link>
      </div>
      
      <!-- 管理功能区 -->
      <div class="nav-section">
        <div v-if="!collapsed" class="section-title">管理</div>
        <router-link 
          v-for="item in adminMenuItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActiveRoute(item.name) }"
        >
          <el-icon :size="16"><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed" class="nav-text">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>
    
    <!-- 底部用户信息 -->
    <div class="sidebar-footer">
      <div class="user-info" :class="{ collapsed }">
        <el-avatar :size="collapsed ? 32 : 36" class="user-avatar">
          <el-icon><User /></el-icon>
        </el-avatar>
        <div v-if="!collapsed" class="user-details">
          <div class="user-name">{{ currentUser?.name || '用户' }}</div>
          <div class="user-role">{{ getRoleLabel(currentUser?.role) }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Setting, Fold, Expand, User,
  House, Folder,
  Monitor, Operation, Avatar,
  DataBoard,
  Files, Clock
} from '@element-plus/icons-vue'

// 临时类型定义
type UserRole = 'admin' | 'project_lead' | 'developer' | 'tester' | 'guest'

interface UserType {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: string[]
  workspaces: string[]
  preferences: any
  createdAt: Date
  isActive: boolean
}

interface Props {
  collapsed?: boolean
}

defineProps<Props>()
defineEmits<{
  toggle: []
}>()

const route = useRoute()

// 模拟当前用户数据
const currentUser = ref<UserType>({
  id: 'user-1',
  email: 'user@example.com',
  name: '开发者',
  role: 'developer',
  permissions: [],
  workspaces: ['default'],
  preferences: {
    theme: 'light',
    language: 'zh-CN',
    notifications: {
      email: true,
      browser: true,
      testResults: true,
      teamUpdates: true
    },
    editor: {
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      minimap: true,
      theme: 'vs-dark'
    }
  },
  createdAt: new Date(),
  isActive: true
})

// 工作空间相关
const workspaces = computed(() => [
  { id: 'default', name: '默认工作空间' },
  { id: 'project-1', name: '项目一' },
  { id: 'project-2', name: '项目二' }
])

const currentWorkspaceId = ref('default')

const handleWorkspaceChange = (workspaceId: string) => {
  // 切换工作空间逻辑
  console.log('切换工作空间:', workspaceId)
}

// 路由激活状态判断
const isActiveRoute = (routeName: string | string[]) => {
  const currentRouteName = route.name as string
  if (Array.isArray(routeName)) {
    return routeName.includes(currentRouteName)
  }
  return currentRouteName === routeName || currentRouteName?.startsWith(routeName + '-')
}

// 核心功能菜单
const coreMenuItems = [
  {
    path: '/workspace',
    name: 'WorkspaceManagement',
    label: '工作空间',
    icon: House
  },
  {
    path: '/collections',
    name: 'CollectionManagement',
    label: 'API集合',
    icon: Folder
  },
  {
    path: '/debugger',
    name: 'ApiDebugger',
    label: '调试工作台',
    icon: Monitor
  },
  {
    path: '/environments',
    name: 'EnvironmentManagement',
    label: '环境管理',
    icon: DataBoard
  },
  {
    path: '/history',
    name: 'HistoryManagement',
    label: '历史记录',
    icon: Clock
  },
  {
    path: '/batch-test',
    name: 'BatchTest',
    label: '批量测试',
    icon: Operation,
    badge: 3 // 示例徽章
  }
]

// 团队协作菜单
const teamMenuItems = [
  {
    path: '/team',
    name: 'TeamManagement',
    label: '团队协作',
    icon: Avatar
  }
]

// 管理功能菜单
const adminMenuItems = [
  {
    path: '/data',
    name: 'DataManagement',
    label: '数据管理',
    icon: Files
  },
  {
    path: '/settings',
    name: 'Settings',
    label: '设置',
    icon: Setting
  }
]

// 用户角色标签
const getRoleLabel = (role?: UserRole) => {
  const roleLabels = {
    admin: '管理员',
    project_lead: '项目负责人',
    developer: '开发者',
    tester: '测试员',
    guest: '访客'
  }
  return role ? roleLabels[role] : '未知'
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-right: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafbfc;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #303133;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
}

.toggle-btn {
  padding: 6px;
  border-radius: 6px;
}

.workspace-selector {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafbfc;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 8px;
}

.section-title {
  padding: 8px 16px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin: 2px 8px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  position: relative;
  font-weight: 500;
  min-height: 40px;
}

.nav-item:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #409eff;
  transform: translateX(4px) scale(1.02);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.nav-item.active {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4), 0 2px 8px rgba(103, 194, 58, 0.2);
  transform: translateX(4px);
}

.nav-item.active .nav-text {
  font-weight: 600;
}

.nav-text {
  font-size: 13px;
  flex: 1;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  margin-left: auto;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 10px 8px;
  margin: 2px 4px;
  min-width: 40px;
}

.collapsed .section-title {
  display: none;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.user-info:hover {
  background: #f0f9ff;
}

.user-info.collapsed {
  justify-content: center;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 滚动条样式 */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>