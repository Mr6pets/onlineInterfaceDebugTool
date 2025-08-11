<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <!-- Use a simple icon instead of image -->
        <div class="logo-icon">
          <el-icon size="24"><Setting /></el-icon>
        </div>
        <span class="logo-text">API Debug Tool Pro</span>
      </div>
    </div>
    
    <div class="header-center">
      <el-select 
        v-if="team" 
        :model-value="team.id" 
        @change="$emit('switch-team', $event)"
        class="team-selector"
      >
        <template #prefix>
          <el-icon><OfficeBuilding /></el-icon>
        </template>
        <el-option :label="team.name" :value="team.id" />
      </el-select>
    </div>
    
    <div class="header-right">
      <el-button text @click="$emit('global-search')">
        <el-icon><Search /></el-icon>
      </el-button>
      
      <el-badge :value="notificationCount" :hidden="notificationCount === 0">
        <el-button text @click="showNotifications">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>
      
      <el-dropdown @command="$emit('user-menu', $event)">
        <div class="user-info">
          <el-avatar :src="user?.avatar" :size="32">
            {{ user?.name?.charAt(0) }}
          </el-avatar>
          <span class="user-name">{{ user?.name }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserProfile, Team } from '@/types'
import { useNotificationStore } from '@/stores/notification'

interface Props {
  user: UserProfile | null
  team: Team | null
}

defineProps<Props>()
defineEmits<{
  'switch-team': [teamId: string]
  'user-menu': [action: string]
  'global-search': []
}>()

const notificationStore = useNotificationStore()
const notificationCount = computed(() => notificationStore.unreadCount)

const showNotifications = () => {
  // 触发通知中心显示
}
</script>

<style scoped>
.app-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #409EFF;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.team-selector {
  width: 200px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  font-size: 14px;
  color: #303133;
}
</style>