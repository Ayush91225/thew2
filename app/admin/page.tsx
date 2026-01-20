'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/stores/admin-store'
import AdminLayout from '@/components/admin/AdminLayout'
import DashboardView from '@/components/admin/DashboardView'
import TeamsView from '@/components/admin/TeamsView'
import ActivityView from '@/components/admin/ActivityView'

export default function AdminPage() {
  const [view, setView] = useState('dashboard')
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const { teams, syncWithIDE, refreshTeams } = useAdminStore()

  // Initialize and sync with real teams
  useEffect(() => {
    refreshTeams() // Load real teams on mount
    syncWithIDE()
    const interval = setInterval(() => {
      syncWithIDE()
      refreshTeams()
    }, 3000) // More frequent updates for real-time feel
    return () => clearInterval(interval)
  }, [])

  return (
    <AdminLayout currentView={view} setView={setView}>
      {view === 'dashboard' && <DashboardView teams={teams} />}
      {view === 'teams' && <TeamsView teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />}
      {view === 'activity' && <ActivityView />}
      {view === 'settings' && (
        <div className="flex items-center justify-center h-[500px] text-zinc-500">
          <div className="text-center">
            <i className="ph ph-gear text-4xl mb-2"></i>
            <p>Settings module coming soon</p>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
