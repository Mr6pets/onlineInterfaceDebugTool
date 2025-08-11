import { defineStore } from 'pinia'
import type { Team, TeamMember } from '@/types'

interface TeamState {
  teams: Team[]
  currentTeam: Team | null
  members: TeamMember[]
  loading: boolean
}

export const useTeamStore = defineStore('team', {
  state: (): TeamState => ({
    teams: [],
    currentTeam: null,
    members: [],
    loading: false
  }),

  getters: {
    teamMembers: (state) => state.members,
    isTeamAdmin: (state) => (userId: string) => {
      const member = state.members.find(m => m.userId === userId)
      return member?.role === 'admin'
    }
  },

  actions: {
    async loadTeams() {
      this.loading = true
      try {
        // 模拟加载团队数据
        const teams: Team[] = [
          {
            id: '1',
            name: 'Development Team',
            description: '开发团队',
            avatar: '',
            memberCount: 5,
            projectCount: 3,
            createdAt: Date.now() - 86400000 * 30,
            settings: {
              allowInvite: true,
              requireApproval: false,
              defaultPermissions: ['read', 'write']
            }
          }
        ]
        
        this.teams = teams
        if (teams.length > 0 && !this.currentTeam) {
          this.currentTeam = teams[0]
          await this.loadTeamMembers(teams[0].id)
        }
      } catch (error) {
        console.error('Failed to load teams:', error)
      } finally {
        this.loading = false
      }
    },

    async switchTeam(teamId: string) {
      const team = this.teams.find(t => t.id === teamId)
      if (team) {
        this.currentTeam = team
        await this.loadTeamMembers(teamId)
      }
    },

    async loadTeamMembers(teamId: string) {
      try {
        // 模拟加载团队成员
        const members: TeamMember[] = [
          {
            id: '1',
            userId: '1',
            teamId,
            name: 'Admin User',
            email: 'admin@example.com',
            avatar: '',
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            status: 'active',
            joinedAt: Date.now() - 86400000 * 30,
            lastActive: Date.now() - 3600000
          }
        ]
        
        this.members = members
      } catch (error) {
        console.error('Failed to load team members:', error)
      }
    }
  }
})