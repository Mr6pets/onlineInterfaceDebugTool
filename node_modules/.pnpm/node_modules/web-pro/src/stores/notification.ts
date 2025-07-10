import { defineStore } from 'pinia'
import type { Notification } from '@/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    unreadCount: 0
  }),

  getters: {
    recentNotifications: (state) => 
      state.notifications.slice(0, 10),
    unreadNotifications: (state) => 
      state.notifications.filter(n => !n.read)
  },

  actions: {
    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false
      }
      
      this.notifications.unshift(newNotification)
      this.updateUnreadCount()
    },

    markAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
        this.updateUnreadCount()
      }
    },

    markAllAsRead() {
      this.notifications.forEach(n => n.read = true)
      this.updateUnreadCount()
    },

    removeNotification(id: string) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notifications.splice(index, 1)
        this.updateUnreadCount()
      }
    },

    clearAll() {
      this.notifications = []
      this.unreadCount = 0
    },

    updateUnreadCount() {
      this.unreadCount = this.notifications.filter(n => !n.read).length
    }
  }
})