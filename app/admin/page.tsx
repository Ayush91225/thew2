'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/stores/admin-store'
import AdminLayout from '@/components/admin/AdminLayout'
import DashboardView from '@/components/admin/DashboardView'
import TeamsView from '@/components/admin/TeamsView'
import ActivityView from '@/components/admin/ActivityView'
import EmployeeManagement from '@/components/admin/EmployeeManagement'

export default function AdminPage() {
  const router = useRouter()
  const [view, setView] = useState('dashboard')
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { teams, syncWithIDE, refreshTeams } = useAdminStore()

  // Verify user is OWNER
  useEffect(() => {
    const verifyAccess = async () => {
      const token = sessionStorage.getItem('auth_token')
      
      if (!token) {
        router.replace('/login')
        return
      }

      try {
        const res = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (!data.success || data.user.role !== 'OWNER') {
          router.replace('/login')
          return
        }

        setUser(data.user)
      } catch (err) {
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    verifyAccess()
  }, [router])

  // Sync teams
  useEffect(() => {
    if (user) {
      refreshTeams()
      syncWithIDE()
      const interval = setInterval(() => {
        syncWithIDE()
        refreshTeams()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <AdminLayout currentView={view} setView={setView}>
      {view === 'dashboard' && <DashboardView teams={teams} />}
      {view === 'teams' && <TeamsView teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />}
      {view === 'employees' && <EmployeeManagement />}
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
