<template>
  <div id="app" class="pro-app">
    <AppHeader 
      :user="currentUser"
      :team="currentTeam"
      @switch-team="handleSwitchTeam"
      @user-menu="handleUserMenu"
    />
    
    <div class="app-body">
      <AppSidebar 
        :current-route="$route.name as string"
        :collapsed="sidebarCollapsed"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
      />
      
      <main class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <router-view />
      </main>
    </div>
    
    <!-- 全局组件 -->
    <NotificationCenter ref="notificationCenter" />
    <CommandPalette v-model="showCommandPalette" />
    <GlobalSearch v-model="showGlobalSearch" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import NotificationCenter from './components/common/NotificationCenter.vue'
import CommandPalette from './components/common/CommandPalette.vue'
import GlobalSearch from './components/common/GlobalSearch.vue'
import { useUserStore } from './stores/user'
import { useTeamStore } from './stores/team'

const router = useRouter()
const userStore = useUserStore()
const teamStore = useTeamStore()

const sidebarCollapsed = ref(false)
const showCommandPalette = ref(false)
const showGlobalSearch = ref(false)
const notificationCenter = ref()

const currentUser = computed(() => userStore.currentUser)
const currentTeam = computed(() => teamStore.currentTeam)

onMounted(() => {
  userStore.loadUser()
  teamStore.fetchTeamData()
  
  // 键盘快捷键
  document.addEventListener('keydown', handleKeydown)
})

const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + K: 命令面板
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    showCommandPalette.value = true
  }
  
  // Ctrl/Cmd + Shift + F: 全局搜索
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
    e.preventDefault()
    showGlobalSearch.value = true
  }
}

const handleSwitchTeam = (teamId: string) => {
  teamStore.switchTeam(teamId)
}

const handleUserMenu = (action: string) => {
  switch (action) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style lang="scss">
.pro-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  
  .app-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    
    .main-content {
      flex: 1;
      margin-left: 240px;
      transition: margin-left 0.3s ease;
      overflow: auto;
      
      &.sidebar-collapsed {
        margin-left: 60px;
      }
    }
  }
}
</style>