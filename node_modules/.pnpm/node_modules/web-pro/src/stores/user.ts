import { defineStore } from 'pinia'
import type { UserProfile } from '@/types'

interface UserState {
  currentUser: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    userName: (state) => state.currentUser?.name || 'Guest',
    userRole: (state) => state.currentUser?.role || 'viewer',
    hasPermission: (state) => (permission: string) => 
      state.currentUser?.permissions.includes(permission) || false
  },

  actions: {
    async login(credentials: { email: string; password: string }) {
      this.loading = true
      try {
        // 模拟登录
        const user: UserProfile = {
          id: '1',
          name: 'Admin User',
          email: credentials.email,
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          lastLogin: Date.now(),
          createdAt: Date.now() - 86400000 * 30
        }
        
        this.currentUser = user
        this.isAuthenticated = true
        
        localStorage.setItem('user', JSON.stringify(user))
      } catch (error) {
        throw new Error('登录失败')
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.currentUser = null
      this.isAuthenticated = false
      localStorage.removeItem('user')
    },

    async loadUser() {
      const saved = localStorage.getItem('user')
      if (saved) {
        try {
          this.currentUser = JSON.parse(saved)
          this.isAuthenticated = true
        } catch (error) {
          console.error('Failed to load user:', error)
        }
      }
    }
  }
})