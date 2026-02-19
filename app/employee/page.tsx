'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Briefcase } from 'lucide-react'
import EmployeeLayout from '@/components/employee/EmployeeLayout'
import TeamsSection from '@/components/employee/TeamsSection'

export default function EmployeePage() {
  const router = useRouter()
  const [view, setView] = useState('dashboard')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Verify user is EMPLOYEE
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

        if (!data.success || data.user.role !== 'EMPLOYEE') {
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

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <EmployeeLayout currentView={view} setView={setView}>
      {view === 'teams' ? (
        <TeamsSection />
      ) : (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                <i className="ph ph-check-circle text-emerald-400 text-2xl"></i>
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Tasks</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-zinc-400">Completed this week</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <i className="ph ph-arrow-up text-xs"></i>
                0% from last week
              </span>
            </div>
          </div>

          <div className="glass border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                <i className="ph ph-clock text-purple-400 text-2xl"></i>
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Hours</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-zinc-400">Logged this week</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <i className="ph ph-minus text-xs"></i>
                No change
              </span>
            </div>
          </div>

          <div className="glass border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                <i className="ph ph-git-branch text-green-400 text-2xl"></i>
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Projects</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-zinc-400">Active projects</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-zinc-500">Start your first project</span>
            </div>
          </div>

          <div className="glass border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                <i className="ph ph-git-commit text-amber-400 text-2xl"></i>
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Commits</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-zinc-400">This month</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-zinc-500">No commits yet</span>
            </div>
          </div>
        </div>

        {/* Activity & Profile Grid */}
        <div className="grid grid-cols-3 gap-6 h-[400px]">
          {/* Recent Activity */}
          <div className="col-span-2 glass border border-white/10 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ph ph-clock-counter-clockwise text-purple-400"></i>
              Recent Activity
            </h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <i className="ph ph-activity text-zinc-700 text-5xl mb-4"></i>
                <p className="text-zinc-500">No recent activity to display</p>
                <p className="text-zinc-600 text-sm mt-2">Your activity will appear here once you start working</p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="col-span-1 glass border border-white/10 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ph ph-user-circle text-emerald-400"></i>
              Profile
            </h3>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-zinc-500">Name</span>
                <span className="text-white font-medium text-sm">{user.name}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-zinc-500">Email</span>
                <span className="text-white font-medium text-sm truncate ml-2">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-zinc-500">Company</span>
                <span className="text-white font-medium text-sm">{user.companyName}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-zinc-500">Role</span>
                <span className="text-white font-medium text-sm capitalize">{user.role}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-zinc-500">Member Since</span>
                <span className="text-white font-medium text-sm">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </EmployeeLayout>
  )
}
