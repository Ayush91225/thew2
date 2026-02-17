'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIDEStore } from '@/stores/ide-store-new'
import { LogOut, Home, Briefcase } from 'lucide-react'

export default function EmployeePage() {
  const router = useRouter()
  const { user, logout } = useIDEStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verify user is authenticated and is an EMPLOYEE
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'EMPLOYEE') {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'OWNER') {
        router.push('/admin')
      } else {
        router.push('/login')
      }
      return
    }

    setIsLoading(false)
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading employee dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.svg" alt="Kriya" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold">Kriya</h1>
              <p className="text-xs text-zinc-400">Employee Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name}!</h2>
          <p className="text-blue-100">You're logged into <span className="font-semibold">{user.companyName}</span></p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Quick Stats */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white">Company</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{user.companyName}</p>
            <p className="text-sm text-zinc-400">Your workplace</p>
          </div>

          {/* Role Info */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white">Role</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1 capitalize">{user.role}</p>
            <p className="text-sm text-zinc-400">Your position</p>
          </div>

          {/* Joined Date */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 font-bold text-lg">📅</span>
              </div>
              <h3 className="font-bold text-white">Joined</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-sm text-zinc-400">Member since</p>
          </div>
        </div>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Assigned Tasks</h3>
            <div className="space-y-3">
              <div className="p-3 bg-zinc-800/50 rounded border border-white/10">
                <p className="text-sm text-white">No tasks assigned yet</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="p-3 bg-zinc-800/50 rounded border border-white/10">
                <p className="text-sm text-white">Account created on {new Date(user.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-zinc-500 mt-1">You joined the team</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-8 bg-zinc-900 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Name</label>
              <p className="text-white font-medium">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Email</label>
              <p className="text-white font-medium">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Role</label>
              <p className="text-white font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Company</label>
              <p className="text-white font-medium">{user.companyName}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
