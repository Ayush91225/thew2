import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { teamService, Team } from '@/lib/team-service'

type Activity = {
  id: number
  type: 'session' | 'file' | 'mode' | 'member' | 'deploy'
  user: string
  action: string
  team?: string
  timestamp: string
  fileId?: string
}

type AdminStore = {
  teams: Team[]
  activities: Activity[]
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => void
  updateTeam: (id: string, updates: Partial<Team>) => void
  deleteTeam: (id: string) => void
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void
  syncWithIDE: () => void
  refreshTeams: () => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      teams: [],
      activities: [],
      
      refreshTeams: () => {
        const realTeams = teamService.getAllTeams()
        set({ teams: realTeams })
      },
      
      addTeam: (team) => {
        // Create team in team service
        const newTeam = teamService.createTeam(team)
        const newActivity = {
          id: Date.now(),
          type: 'member' as const,
          user: 'Admin',
          action: `created ${team.name}`,
          timestamp: new Date().toISOString()
        }
        set((state) => ({
          activities: [newActivity, ...state.activities]
        }))
        get().refreshTeams()
      },
      
      updateTeam: (id, updates) => {
        // Update in team service
        get().refreshTeams()
      },
      
      deleteTeam: (id) => {
        const team = get().teams.find(t => t.id === id)
        const newActivity = {
          id: Date.now(),
          type: 'member' as const,
          user: 'Admin',
          action: `deleted ${team?.name}`,
          timestamp: new Date().toISOString()
        }
        set((state) => ({
          activities: [newActivity, ...state.activities]
        }))
        get().refreshTeams()
      },
      addActivity: (activity) => set((state) => ({
        activities: [{
          ...activity,
          id: Date.now(),
          timestamp: new Date().toISOString()
        }, ...state.activities]
      })),
      
      syncWithIDE: () => {
        // Initialize default activities if empty
        const currentState = get()
        if (currentState.activities.length === 0) {
          const defaultActivities = [
            {
              id: 1,
              type: 'session' as const,
              user: 'John Doe',
              action: 'started live session',
              team: 'Frontend Team',
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
            },
            {
              id: 2,
              type: 'file' as const,
              user: 'Sarah Chen',
              action: 'modified App.tsx',
              team: 'Backend Team',
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
            },
            {
              id: 3,
              type: 'deploy' as const,
              user: 'Mike Wilson',
              action: 'deployed to production',
              team: 'DevOps',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            },
            {
              id: 4,
              type: 'member' as const,
              user: 'Admin',
              action: 'invited new member',
              team: 'Frontend Team',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 5,
              type: 'mode' as const,
              user: 'Lisa Park',
              action: 'switched to LIVE mode',
              team: 'Design Team',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            }
          ]
          set({ activities: defaultActivities })
        }
        
        // Refresh teams from service
        get().refreshTeams()
        
        if (typeof window === 'undefined') return
        
        try {
          const ideStore = (window as any).useIDEStore?.getState()
          if (!ideStore) return
          
          // Generate activities based on IDE state
          const params = new URLSearchParams(window.location.search)
          const teamId = params.get('team')
          
          if (teamId && ideStore.tabs?.length > 0) {
            const team = teamService.getTeam(teamId)
            if (team) {
              // Update team activity based on IDE state
              const activeTab = ideStore.tabs.find((t: any) => t.id === ideStore.activeTab)
              if (activeTab) {
                teamService.updateMemberStatus(teamId, 'current-user', 'online', activeTab.name)
              }
              
              if (ideStore.collab) {
                teamService.setTeamMode(teamId, 'LIVE')
                teamService.joinSession(teamId, 'current-user')
              } else {
                teamService.setTeamMode(teamId, 'SOLO')
              }
            }
          }
          
          get().refreshTeams()
        } catch (error) {
          console.warn('Failed to sync with IDE:', error)
        }
      }
    }),
    {
      name: 'kriya-admin-storage'
    }
  )
)
