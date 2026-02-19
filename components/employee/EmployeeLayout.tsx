"use client"

import { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useIDEStore } from '@/stores/ide-store-new'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface EmployeeLayoutProps {
  children: React.ReactNode
  currentView: string
  setView: (view: string) => void
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: 'ph-squares-four' },
  { id: 'teams', label: 'Teams', icon: 'ph-users' },
] as const

const NavButton = memo(({ item, currentView, setView }: { 
  item: typeof NAV_ITEMS[number], 
  currentView: string, 
  setView: (view: string) => void 
}) => {
  const isActive = currentView === item.id

  return (
    <button
      onClick={() => setView(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative
          ${isActive
              ? 'text-white bg-white/5 shadow-lg shadow-black/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
    >
      <i className={`ph ${item.icon} text-lg ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}></i>
      {item.label}

      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full"
        />
      )}
    </button>
  )
})

const UserProfile = memo(({ user, logout }: { user: any, logout: () => void }) => {
  const handleLogout = useCallback(() => {
    logout()
    window.location.href = '/'
  }, [logout])

  if (!user) return null

  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
      <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10">
        <img src={user.avatar || '/logo.svg'} className="w-full h-full object-cover" alt="User" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-zinc-500 truncate capitalize">{user.role}</p>
      </div>
      <button
        onClick={handleLogout}
        className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition"
        title="Logout"
      >
        <i className="ph ph-sign-out text-zinc-500 group-hover:text-red-400"></i>
      </button>
    </div>
  )
})

export default function EmployeeLayout({ children, currentView, setView }: EmployeeLayoutProps) {
  const { logout } = useIDEStore()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token')
    if (token) {
      fetch('/api/auth/verify', { 
        method: 'GET', 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.user?.role === 'EMPLOYEE') {
            setUser(data.user)
          }
        })
        .catch(() => {})
    }
  }, [])

  const currentNavItem = useMemo(() => NAV_ITEMS.find(n => n.id === currentView), [currentView])

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/6 rounded-full blur-[120px]" />
      </div>

      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-56 border-r border-white/5 bg-black/40 backdrop-blur-xl z-20 flex flex-col"
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <Logo className="w-8 h-8" />
          <div>
            <h1 className="font-bold text-lg tracking-tight">KRIYA</h1>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Employee
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.id} item={item} currentView={currentView} setView={setView} />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-3">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
            <i className="ph ph-gear text-lg"></i>
            Settings
          </button>
          {user && <UserProfile user={user} logout={logout} />}
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-sm px-8 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold capitalize">{currentNavItem?.label}</h2>

          <div className="flex items-center gap-4">
            <Link
              href="/ide"
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition flex items-center gap-2"
            >
              Open IDE
              <i className="ph ph-arrow-right"></i>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
