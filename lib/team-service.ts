interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: 'lead' | 'developer' | 'designer'
  status: 'online' | 'offline' | 'away'
  lastSeen: string
  currentFile?: string
  cursor?: { line: number; column: number }
}

interface TeamWorkspace {
  id: string
  teamId: string
  files: Array<{
    id: string
    name: string
    path: string
    content: string
    lastModified: string
    modifiedBy: string
  }>
  activeFiles: string[]
  sharedState: {
    mode: 'LIVE' | 'SOLO'
    activeMembers: string[]
    currentSession?: string
  }
}

interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
  workspace: TeamWorkspace
  createdAt: string
  lastActivity: string
}

// Use singleton pattern to persist teams across module reloads
let _teams: Map<string, Team> | null = null
const globalKey = '__kriya_team_storage__'

if (typeof global !== 'undefined' && (global as any)[globalKey]) {
  _teams = (global as any)[globalKey].teams
} else {
  _teams = new Map<string, Team>()
  if (typeof global !== 'undefined') {
    (global as any)[globalKey] = { teams: _teams }
  }
}

class TeamService {
  private teams = _teams!
  private activeConnections = new Map<string, WebSocket[]>()

  constructor() {
    if (this.teams.size === 0) {
      this.initializeDefaultTeams()
    }
  }

  private initializeDefaultTeams() {
    // Create real teams with actual members
    const team1: Team = {
      id: 'team-1',
      name: 'Frontend Team',
      description: 'React & Next.js Development',
      members: [
        {
          id: 'user-1',
          name: 'Sarah Chen',
          email: 'sarah@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
          role: 'lead',
          status: 'online',
          lastSeen: new Date().toISOString(),
          currentFile: 'components/Dashboard.tsx'
        },
        {
          id: 'user-2', 
          name: 'Mike Johnson',
          email: 'mike@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
          role: 'developer',
          status: 'online',
          lastSeen: new Date().toISOString(),
          currentFile: 'pages/api/users.ts'
        },
        {
          id: 'user-3',
          name: 'Lisa Park',
          email: 'lisa@company.com', 
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
          role: 'designer',
          status: 'away',
          lastSeen: new Date(Date.now() - 300000).toISOString()
        }
      ],
      workspace: {
        id: 'workspace-1',
        teamId: 'team-1',
        files: [
          {
            id: 'file-1',
            name: 'Dashboard.tsx',
            path: '/src/components/Dashboard.tsx',
            content: `import React from 'react'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    // Fetch dashboard data
    const response = await fetch('/api/dashboard')
    setData(await response.json())
  }
  
  return (
    <div className="dashboard">
      <h1>Team Dashboard</h1>
      {/* Dashboard content */}
    </div>
  )
}`,
            lastModified: new Date().toISOString(),
            modifiedBy: 'user-1'
          },
          {
            id: 'file-2',
            name: 'users.ts',
            path: '/src/pages/api/users.ts',
            content: `import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Get users
    const users = await getUsers()
    res.status(200).json(users)
  } else if (req.method === 'POST') {
    // Create user
    const user = await createUser(req.body)
    res.status(201).json(user)
  }
}`,
            lastModified: new Date(Date.now() - 120000).toISOString(),
            modifiedBy: 'user-2'
          }
        ],
        activeFiles: ['file-1', 'file-2'],
        sharedState: {
          mode: 'LIVE',
          activeMembers: ['user-1', 'user-2'],
          currentSession: 'session-1'
        }
      },
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      lastActivity: new Date().toISOString()
    }

    const team2: Team = {
      id: 'team-2',
      name: 'Backend Team',
      description: 'API & Database Development',
      members: [
        {
          id: 'user-4',
          name: 'Alex Rodriguez',
          email: 'alex@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
          role: 'lead',
          status: 'online',
          lastSeen: new Date().toISOString(),
          currentFile: 'server.js'
        },
        {
          id: 'user-5',
          name: 'Emma Wilson',
          email: 'emma@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
          role: 'developer',
          status: 'offline',
          lastSeen: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      workspace: {
        id: 'workspace-2',
        teamId: 'team-2',
        files: [
          {
            id: 'file-3',
            name: 'server.js',
            path: '/src/server.js',
            content: `const express = require('express')
const app = express()

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})`,
            lastModified: new Date(Date.now() - 60000).toISOString(),
            modifiedBy: 'user-4'
          }
        ],
        activeFiles: ['file-3'],
        sharedState: {
          mode: 'SOLO',
          activeMembers: ['user-4'],
          currentSession: undefined
        }
      },
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      lastActivity: new Date(Date.now() - 60000).toISOString()
    }

    this.teams.set(team1.id, team1)
    this.teams.set(team2.id, team2)
  }

  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId)
  }

  getAllTeams(): Team[] {
    return Array.from(this.teams.values())
  }

  updateMemberStatus(teamId: string, memberId: string, status: TeamMember['status'], currentFile?: string) {
    const team = this.teams.get(teamId)
    if (!team) return

    const member = team.members.find(m => m.id === memberId)
    if (member) {
      member.status = status
      member.lastSeen = new Date().toISOString()
      if (currentFile) member.currentFile = currentFile
      
      team.lastActivity = new Date().toISOString()
    }
  }

  updateFileContent(teamId: string, fileId: string, content: string, modifiedBy: string) {
    const team = this.teams.get(teamId)
    if (!team) return

    const file = team.workspace.files.find(f => f.id === fileId)
    if (file) {
      file.content = content
      file.lastModified = new Date().toISOString()
      file.modifiedBy = modifiedBy
      
      team.lastActivity = new Date().toISOString()
    }
  }

  setTeamMode(teamId: string, mode: 'LIVE' | 'SOLO') {
    const team = this.teams.get(teamId)
    if (!team) return

    team.workspace.sharedState.mode = mode
    if (mode === 'LIVE') {
      team.workspace.sharedState.currentSession = `session-${Date.now()}`
    } else {
      team.workspace.sharedState.currentSession = undefined
      team.workspace.sharedState.activeMembers = []
    }
    
    team.lastActivity = new Date().toISOString()
  }

  joinSession(teamId: string, memberId: string) {
    const team = this.teams.get(teamId)
    if (!team) return

    if (!team.workspace.sharedState.activeMembers.includes(memberId)) {
      team.workspace.sharedState.activeMembers.push(memberId)
    }
    
    this.updateMemberStatus(teamId, memberId, 'online')
  }

  leaveSession(teamId: string, memberId: string) {
    const team = this.teams.get(teamId)
    if (!team) return

    team.workspace.sharedState.activeMembers = 
      team.workspace.sharedState.activeMembers.filter(id => id !== memberId)
    
    this.updateMemberStatus(teamId, memberId, 'offline')
  }

  addMember(teamId: string, member: Omit<TeamMember, 'lastSeen'>) {
    const team = this.teams.get(teamId)
    if (!team) return

    const existingMember = team.members.find(m => m.id === member.id)
    if (existingMember) return

    team.members.push({
      ...member,
      lastSeen: new Date().toISOString()
    })
    team.lastActivity = new Date().toISOString()
  }

  removeMember(teamId: string, memberId: string) {
    const team = this.teams.get(teamId)
    if (!team) return

    team.members = team.members.filter(m => m.id !== memberId)
    team.workspace.sharedState.activeMembers = 
      team.workspace.sharedState.activeMembers.filter(id => id !== memberId)
    team.lastActivity = new Date().toISOString()
    
    return team
  }

  createTeam(team: Omit<Team, 'id' | 'createdAt' | 'lastActivity'>) {
    const teamId = `team-${Date.now()}`
    const newTeam: Team = {
      ...team,
      id: teamId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }
    this.teams.set(teamId, newTeam)
    return newTeam
  }
}

export const teamService = new TeamService()
export type { Team, TeamMember, TeamWorkspace }