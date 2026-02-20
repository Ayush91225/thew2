'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function TeamsSection() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [teams, setTeams] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    fetchTeams()
    fetchNotifications()
    
    // Poll for notifications every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchTeams = async () => {
    try {
      const token = sessionStorage.getItem('auth_token')
      const res = await fetch('/api/teams/my-teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setTeams(data.teams)
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem('auth_token')
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications.filter((n: any) => !n.read))
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = sessionStorage.getItem('auth_token')
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      })
      setNotifications(notifications.filter(n => n.id !== notificationId))
      fetchTeams()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    for (const notification of notifications) {
      await markAsRead(notification.id)
    }
    setShowNotifications(false)
  }

  const handleOpenIDE = (team: any) => {
    localStorage.setItem('activeTeam', JSON.stringify(team))
    router.push(`/ide?team=${team.id}&mode=${team.workspace.sharedState.mode}`)
  }

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-lg transition flex items-center gap-2 border border-white/5 relative"
            >
              <i className="ph ph-bell text-lg"></i>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-96 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-white">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500">
                        <i className="ph ph-bell-slash text-4xl mb-2"></i>
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-white/5 hover:bg-white/5 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className={notification.type === 'team_added' ? 'w-2 h-2 rounded-full mt-2 shrink-0 bg-emerald-500' : 'w-2 h-2 rounded-full mt-2 shrink-0 bg-red-500'}></div>
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">{notification.message}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-zinc-500 hover:text-white"
                            >
                              <i className="ph ph-x text-sm"></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex-1 glass border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-[3fr_2fr_1fr_1fr_1fr] px-6 py-4 bg-white/5 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div>Team Name</div>
          <div>Description</div>
          <div>Mode</div>
          <div>Members</div>
          <div>IDE Access</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center text-zinc-500">Loading teams...</div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ph ph-users text-zinc-600 text-3xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-zinc-400 mb-2">No Teams Yet</h4>
              <p className="text-zinc-600 text-sm max-w-md mx-auto">
                You are not part of any teams yet. Wait for an invitation from your admin.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              {filteredTeams.map(team => (
                <div
                  key={team.id}
                  className="grid grid-cols-[3fr_2fr_1fr_1fr_1fr] px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors group items-center"
                >
                  <div>
                    <div className="font-semibold text-white">{team.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-zinc-400">{team.description}</div>
                  <div>
                    <span className={team.workspace.sharedState.mode === 'LIVE' ? 'px-2 py-1 rounded text-xs font-bold border bg-green-500/10 text-green-400 border-green-500/20' : 'px-2 py-1 rounded text-xs font-bold border bg-zinc-800 text-zinc-400 border-zinc-700'}>
                      {team.workspace.sharedState.mode}
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 3).map((member: any) => (
                      <div
                        key={member.id}
                        className="w-8 h-8 rounded-full border-2 border-black overflow-hidden"
                        title={member.name}
                      >
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                        +{team.members.length - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => handleOpenIDE(team)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md transition flex items-center gap-1.5"
                    >
                      <i className="ph ph-code text-sm"></i>
                      Open IDE
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
