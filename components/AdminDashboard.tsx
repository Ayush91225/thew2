'use client'
import { useState, useEffect } from 'react'
import { useAdminStore } from '@/stores/admin-store'
import KriyaLogo from './logo/KriyaLogo'

export default function AdminDashboard() {
  const [view, setView] = useState('dashboard')
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const { teams, activities, addTeam, deleteTeam, syncWithIDE } = useAdminStore()

  // Sync with IDE every 5 seconds
  useEffect(() => {
    syncWithIDE()
    const interval = setInterval(syncWithIDE, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-8 py-4 border-b-line bg-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <KriyaLogo className="w-6 h-6" />
            <div className="text-sm font-semibold tracking-[2px]">KRIYA ADMIN</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-zinc-400">Synced with IDE</span>
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <button
            onClick={() => setView('dashboard')}
            className={`text-sm transition-colors ${view === 'dashboard' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('teams')}
            className={`text-sm transition-colors ${view === 'teams' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Teams
          </button>
          <button
            onClick={() => setView('activity')}
            className={`text-sm transition-colors ${view === 'activity' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Activity
          </button>
        </div>
      </nav>

      <main className="flex-1 p-8 overflow-y-auto">
        {view === 'dashboard' && <Dashboard teams={teams} />}
        {view === 'teams' && <Teams teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />}
        {view === 'activity' && <Activity />}
      </main>
    </div>
  )
}

const TimeAgo = ({ timestamp }: { timestamp: string }) => {
  const [timeString, setTimeString] = useState('')

  useEffect(() => {
    const calculateTime = () => {
      const diff = Date.now() - new Date(timestamp).getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
      if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }

    setTimeString(calculateTime())
    const interval = setInterval(() => setTimeString(calculateTime()), 60000)
    return () => clearInterval(interval)
  }, [timestamp])

  // Prevent hydration mismatch by rendering a placeholder or empty string initially
  // tailored to match server output if possible, or just wait for client
  if (!timeString) return <span suppressHydrationWarning>{new Date(timestamp).toLocaleDateString()}</span>

  return <span>{timeString}</span>
}

function Dashboard({ teams }: { teams: any[] }) {
  const { activities } = useAdminStore()

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total Teams" value={teams.length.toString()} />
        <Card title="Active Teams" value={teams.filter(t => t.mode === 'LIVE').length.toString()} />
        <Card title="Members" value={teams.reduce((sum, t) => sum + t.members, 0).toString()} />
        <Card title="Live Sessions" value={teams.filter(t => t.mode === 'LIVE').length.toString()} />
      </div>

      <section className="mt-8">
        <h3 className="mb-4 text-base font-semibold">Recent Activity</h3>
        <div className="bg-black border-line rounded-lg p-2">
          {activities.slice(0, 5).map((activity) => (
            <ActivityItem key={activity.id} live={activity.type === 'session'}>
              <p><b>{activity.user}</b> {activity.action}</p>
              <span className="text-zinc-400 text-sm">
                <TimeAgo timestamp={activity.timestamp} />{activity.team ? ` · ${activity.team}` : ''}
              </span>
            </ActivityItem>
          ))}
        </div>
      </section>
    </>
  )
}

function Teams({ teams, selectedTeam, setSelectedTeam }: {
  teams: any[]
  selectedTeam: any
  setSelectedTeam: (team: any) => void
}) {
  const { addTeam, deleteTeam } = useAdminStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', description: '', members: 1, mode: 'SOLO' as 'LIVE' | 'SOLO' })

  const handleCreate = () => {
    if (newTeam.name && newTeam.description) {
      addTeam(newTeam)
      setNewTeam({ name: '', description: '', members: 1, mode: 'SOLO' })
      setShowCreate(false)
    }
  }

  const handleDelete = (id: number) => {
    deleteTeam(id)
    if (selectedTeam?.id === id) setSelectedTeam(null)
  }

  return (
    <div className="grid grid-cols-[1fr_300px] gap-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Teams</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary"
          >
            {showCreate ? 'Cancel' : '+ Create Team'}
          </button>
        </div>

        {showCreate && (
          <div className="bg-black border-line rounded-lg p-5 mb-4 flex flex-col gap-3">
            <input
              placeholder="Team Name"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              className="input-minimal"
            />
            <input
              placeholder="Description"
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              className="input-minimal"
            />
            <input
              type="number"
              placeholder="Members"
              value={newTeam.members}
              onChange={(e) => setNewTeam({ ...newTeam, members: parseInt(e.target.value) || 1 })}
              className="input-minimal"
            />
            <select
              value={newTeam.mode}
              onChange={(e) => setNewTeam({ ...newTeam, mode: e.target.value as 'LIVE' | 'SOLO' })}
              className="input-minimal"
            >
              <option value="SOLO">SOLO</option>
              <option value="LIVE">LIVE</option>
            </select>
            <button
              onClick={handleCreate}
              className="btn-primary"
            >
              CREATE
            </button>
          </div>
        )}

        <div className="border-line rounded-lg overflow-hidden bg-black">
          <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] px-5 py-4 bg-black label">
            <span>Team</span>
            <span>Description</span>
            <span>Members</span>
            <span>Mode</span>
            <span>Actions</span>
          </div>

          {teams.map(team => (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] px-5 py-4 border-t-line hover-item cursor-pointer"
            >
              <span>{team.name}</span>
              <span>{team.description}</span>
              <span>{team.members}</span>
              <span className={team.mode === 'LIVE' ? 'text-white font-semibold' : 'text-zinc-400 font-semibold'}>{team.mode}</span>
              <span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(team.id); }}
                  className="btn-secondary"
                >
                  DELETE
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedTeam && (
        <div className="bg-black border-line rounded-lg p-5 h-fit sticky top-0">
          <h3 className="text-base mb-4">Team Preview</h3>
          <div className="flex flex-col gap-3 text-sm">
            <p><b>Name:</b> {selectedTeam.name}</p>
            <p><b>Description:</b> {selectedTeam.description}</p>
            <p><b>Members:</b> {selectedTeam.members}</p>
            <p>
              <b>Mode:</b> <span className={selectedTeam.mode === 'LIVE' ? 'text-white font-semibold' : 'text-zinc-400 font-semibold'}>{selectedTeam.mode}</span>
            </p>
            {selectedTeam.activeUsers && selectedTeam.activeUsers.length > 0 && (
              <div>
                <b>Active Users:</b>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTeam.activeUsers.map((user: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-xs">{user}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedTeam.lastActivity && (
              <p className="text-xs text-zinc-500">
                Last activity: {new Date(selectedTeam.lastActivity).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Activity() {
  const { activities } = useAdminStore()

  return (
    <div className="bg-black border-line rounded-lg p-2">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} live={activity.type === 'session'}>
          <p><b>{activity.user}</b> {activity.action}</p>
          <span className="text-zinc-400 text-sm">
            <TimeAgo timestamp={activity.timestamp} />{activity.team ? ` · ${activity.team}` : ''}
          </span>
        </ActivityItem>
      ))}
    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="metric-card p-5 rounded-lg">
      <span className="text-zinc-400 text-sm">{title}</span>
      <strong className="block text-3xl mt-2 font-semibold">{value}</strong>
    </div>
  )
}

function ActivityItem({ live, children }: { live?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-md hover-item">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${live ? 'bg-white' : 'bg-zinc-600'}`} />
      <div className="text-sm">{children}</div>
    </div>
  )
}
