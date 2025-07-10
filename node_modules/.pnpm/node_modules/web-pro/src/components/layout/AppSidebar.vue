<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <el-button 
        text 
        @click="$emit('toggle')"
        class="collapse-btn"
      >
        <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
      </el-button>
    </div>
    
    <nav class="sidebar-nav">
      <el-menu 
        :default-active="currentRoute"
        :collapse="collapsed"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表板</span>
        </el-menu-item>
        
        <el-menu-item index="performance">
          <el-icon><TrendCharts /></el-icon>
          <span>性能监控</span>
        </el-menu-item>
        
        <el-menu-item index="team">
          <el-icon><UserFilled /></el-icon>
          <span>团队协作</span>
        </el-menu-item>
        
        <el-menu-item index="documentation">
          <el-icon><Document /></el-icon>
          <span>API文档</span>
        </el-menu-item>
        
        <el-menu-item index="automation">
          <el-icon><MagicStick /></el-icon>
          <span>自动化测试</span>
        </el-menu-item>
        
        <el-menu-item index="mock-server">
          <el-icon><Service /></el-icon>
          <span>Mock服务器</span>
        </el-menu-item>
      </el-menu>
    </nav>
  </aside>
</template>

<script setup lang="ts">
interface Props {
  currentRoute: string
  collapsed: boolean
}

defineProps<Props>()
defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.app-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e4e7ed;
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  transition: width 0.3s ease;
  z-index: 999;
}

.app-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 15px;
  border-bottom: 1px solid #e4e7ed;
}

.collapse-btn {
  width: 30px;
  height: 30px;
}

.sidebar-nav {
  height: calc(100% - 50px);
  overflow-y: auto;
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}
</style>