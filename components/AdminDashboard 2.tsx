'use client'

import { useState } from 'react'
import { Users, FolderOpen, GitBranch, Clock, SignOut, ChartBar } from 'phosphor-react'

interface Team {
  id: string
  name: string
  members: number
  activeProjects: number
  status: 'active' | 'idle' | 'blocked'
  lead: string
}

interface TeamLead {
  id: string
  name: string
  avatar: string
  team: string
  email: string
  projects: number
}

interface ProjectHead {
  id: string
  name: string
  avatar: string
  role: string
  project: string
  description: string
  progress: number
  team: string
}

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [teams] = useState<Team[]>([
    { id: '1', name: 'Frontend Team', members: 8, activeProjects: 3, status: 'active', lead: 'Sarah Chen' },
    { id: '2', name: 'Backend Team', members: 6, activeProjects: 2, status: 'active', lead: 'Marcus Johnson' },
    { id: '3', name: 'DevOps Team', members: 4, activeProjects: 1, status: 'idle', lead: 'Priya Sharma' },
    { id: '4', name: 'Mobile Team', members: 5, activeProjects: 2, status: 'active', lead: 'Alex Rivera' },
    { id: '5', name: 'QA Team', members: 4, activeProjects: 4, status: 'blocked', lead: 'Emily Watson' },
  ])

  const [teamLeads] = useState<TeamLead[]>([
    { id: '1', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah', team: 'Frontend Team', email: 'sarah.chen@kriya.dev', projects: 3 },
    { id: '2', name: 'Marcus Johnson', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus', team: 'Backend Team', email: 'marcus.j@kriya.dev', projects: 2 },
    { id: '3', name: 'Priya Sharma', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya', team: 'DevOps Team', email: 'priya.s@kriya.dev', projects: 1 },
    { id: '4', name: 'Alex Rivera', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex', team: 'Mobile Team', email: 'alex.r@kriya.dev', projects: 2 },
    { id: '5', name: 'Emily Watson', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Emily', team: 'QA Team', email: 'emily.w@kriya.dev', projects: 4 },
  ])

  const [projectHeads] = useState<ProjectHead[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
      role: 'Lead Frontend Engineer',
      project: 'E-Commerce Platform',
      description: 'Building a scalable React-based e-commerce platform with Next.js 14, implementing advanced cart features and payment integration.',
      progress: 75,
      team: 'Frontend Team'
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus',
      role: 'Backend Architect',
      project: 'Microservices API',
      description: 'Designing and implementing microservices architecture using Node.js and GraphQL for high-performance data processing.',
      progress: 60,
      team: 'Backend Team'
    },
    {
      id: '3',
      name: 'Priya Sharma',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
      role: 'DevOps Lead',
      project: 'CI/CD Pipeline',
      description: 'Setting up automated deployment pipelines with GitHub Actions, Docker, and Kubernetes for seamless production releases.',
      progress: 85,
      team: 'DevOps Team'
    },
    {
      id: '4',
      name: 'Alex Rivera',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
      role: 'Mobile Team Lead',
      project: 'Cross-Platform App',
      description: 'Developing React Native application with offline-first architecture and real-time synchronization capabilities.',
      progress: 45,
      team: 'Mobile Team'
    },
    {
      id: '5',
      name: 'Emily Watson',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Emily',
      role: 'QA Manager',
      project: 'Test Automation Suite',
      description: 'Creating comprehensive automated testing framework using Playwright and Jest for end-to-end quality assurance.',
      progress: 90,
      team: 'QA Team'
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'blocked': return 'bg-red-500'
      default: return 'bg-zinc-500'
    }
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <div className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-xs text-zinc-500">Overview of teams and projects</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
          >
            <SignOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-blue-400" size={20} />
                <span className="text-2xl font-bold text-white">27</span>
              </div>
              <p className="text-xs text-zinc-400">Total Members</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <FolderOpen className="text-green-400" size={20} />
                <span className="text-2xl font-bold text-white">12</span>
              </div>
              <p className="text-xs text-zinc-400">Active Projects</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <GitBranch className="text-purple-400" size={20} />
                <span className="text-2xl font-bold text-white">5</span>
              </div>
              <p className="text-xs text-zinc-400">Teams</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <ChartBar className="text-orange-400" size={20} />
                <span className="text-2xl font-bold text-white">68%</span>
              </div>
              <p className="text-xs text-zinc-400">Avg Progress</p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-3">Active Teams</h2>
            <div className="grid grid-cols-5 gap-3">
              {teams.map((team) => (
                <div key={team.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white text-sm font-medium">{team.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(team.status)}`} />
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{team.members} members • {team.activeProjects} projects</p>
                  <p className="text-xs text-zinc-400">Lead: {team.lead}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-3">Team Leads</h2>
            <div className="grid grid-cols-5 gap-3">
              {teamLeads.map((lead) => (
                <div key={lead.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={lead.avatar} alt={lead.name} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-sm font-medium truncate">{lead.name}</h3>
                      <p className="text-xs text-zinc-500 truncate">{lead.team}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mb-1">{lead.email}</p>
                  <p className="text-xs text-zinc-500">{lead.projects} active projects</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-3">Project Details</h2>
            <div className="space-y-3">
              {projectHeads.map((head) => (
                <div key={head.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex gap-4">
                    <img src={head.avatar} alt={head.name} className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white text-sm font-semibold">{head.name}</h3>
                          <p className="text-xs text-zinc-400">{head.role}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded">{head.team}</span>
                      </div>
                      <p className="text-xs font-medium text-white mb-1">{head.project}</p>
                      <p className="text-xs text-zinc-400 mb-2">{head.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${head.progress}%` }} />
                        </div>
                        <span className="text-xs text-zinc-400">{head.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
