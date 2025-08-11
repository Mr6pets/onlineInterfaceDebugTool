<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <el-icon><Setting /></el-icon>
        <span v-if="!collapsed" class="logo-text">API Tool</span>
      </div>
      <el-button 
        @click="$emit('toggle')" 
        text 
        class="toggle-btn"
      >
        <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
      </el-button>
    </div>
    
    <nav class="sidebar-nav">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: currentRoute === item.name }"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span v-if="!collapsed" class="nav-text">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Setting, Fold, Expand, Collection, Document, DataAnalysis } from '@element-plus/icons-vue'

interface Props {
  collapsed?: boolean
}

defineProps<Props>()
defineEmits<{
  toggle: []
}>()

const route = useRoute()
const currentRoute = computed(() => route.name)

const menuItems = [
  {
    path: '/collections',
    name: 'Collections',
    label: '接口集合',
    icon: Collection
  },
  {
    path: '/documentation',
    name: 'Documentation', 
    label: '文档',
    icon: Document
  },
  {
    path: '/analytics',
    name: 'Analytics',
    label: '分析',
    icon: DataAnalysis
  }
]
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.logo-text {
  font-size: 16px;
}

.toggle-btn {
  padding: 4px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
  border-right: 2px solid #409eff;
}

.nav-text {
  font-size: 14px;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}
</style>