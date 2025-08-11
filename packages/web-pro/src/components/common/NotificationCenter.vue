<template>
  <div class="notification-center">
    <!-- 通知列表 -->
    <transition-group name="notification" tag="div" class="notifications">
      <div 
        v-for="notification in visibleNotifications" 
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
      >
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-title">{{ notification.title }}</span>
            <el-button 
              text 
              size="small" 
              @click="removeNotification(notification.id)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <p class="notification-message">{{ notification.message }}</p>
          <div v-if="notification.actions" class="notification-actions">
            <el-button 
              v-for="action in notification.actions" 
              :key="action.label"
              size="small"
              @click="action.action()"
            >
              {{ action.label }}
            </el-button>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

const visibleNotifications = computed(() => 
  notificationStore.recentNotifications.filter(n => !n.read)
)

const removeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}
</script>

<style scoped>
.notification-center {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 2000;
  width: 350px;
}

.notifications {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #409eff;
  padding: 15px;
}

.notification-success {
  border-left-color: #67c23a;
}

.notification-warning {
  border-left-color: #e6a23c;
}

.notification-error {
  border-left-color: #f56c6c;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  color: #303133;
}

.notification-message {
  color: #606266;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>