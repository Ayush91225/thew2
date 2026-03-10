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

class TeamService {
  private teams = new Map<string, Team>()
  private activeConnections = new Map<string, WebSocket[]>()

  constructor() {
    // No default teams - start fresh
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