<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <div class="logo-icon">
          <el-icon size="24"><Setting /></el-icon>
        </div>
        <span class="logo-text">API Debug Tool</span>
      </div>
    </div>
    
    <div class="header-center">
      <!-- Search or other center content can go here -->
    </div>
    
    <div class="header-right">
      <el-button text @click="showSearch">
        <el-icon><Search /></el-icon>
      </el-button>
      
      <el-dropdown @command="handleUserMenu">
        <div class="user-info">
          <el-avatar :size="32">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="user-name">用户</span>
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
import { 
  Setting, 
  Search, 
  User, 
  ArrowDown, 
  SwitchButton 
} from '@element-plus/icons-vue'

const showSearch = () => {
  // 实现搜索功能
  console.log('Show search')
}

const handleUserMenu = (command: string) => {
  switch (command) {
    case 'profile':
      console.log('Show profile')
      break
    case 'settings':
      console.log('Show settings')
      break
    case 'logout':
      console.log('Logout')
      break
  }
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