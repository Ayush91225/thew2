'use client'

import { useState, useEffect } from 'react'
import KriyaLogo from '../logo/KriyaLogo'
import { motion, AnimatePresence } from 'framer-motion'
import { useIDEStore } from '@/stores/ide-store-new'
import Link from 'next/link'

interface AdminLayoutProps {
    children: React.ReactNode
    currentView: string
    setView: (view: any) => void
}

export default function AdminLayout({ children, currentView, setView }: AdminLayoutProps) {
    const { user, logout } = useIDEStore()

    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: 'ph-squares-four' },
        { id: 'teams', label: 'Teams', icon: 'ph-users-three' },
        { id: 'activity', label: 'Activity', icon: 'ph-pulse' },
        { id: 'settings', label: 'Settings', icon: 'ph-gear' },
    ]

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden selection:bg-blue-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            </div>

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl z-20 flex flex-col"
            >
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <KriyaLogo className="w-8 h-8" />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">KRIYA</h1>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Admin
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative
                ${currentView === item.id
                                    ? 'text-white bg-white/5 shadow-lg shadow-black/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <i className={`ph ${item.icon} text-lg ${currentView === item.id ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}></i>
                            {item.label}

                            {currentView === item.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    {user && (
                        <div className="glass rounded-xl p-3 flex items-center gap-3 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10">
                                <img src={user.avatar} className="w-full h-full object-cover" alt="User" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-xs text-zinc-500 truncate capitalize">{user.role}</p>
                            </div>
                            <button
                                onClick={() => {
                                    logout()
                                    window.location.href = '/login'
                                }}
                                className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition"
                                title="Logout"
                            >
                                <i className="ph ph-sign-out text-zinc-500 group-hover:text-red-400"></i>
                            </button>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-sm px-8 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-semibold capitalize">{navItems.find(n => n.id === currentView)?.label}</h2>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs font-medium text-green-400">System Healthy</span>
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-2"></div>

                        <button className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition border border-white/5">
                            <i className="ph ph-bell text-zinc-400"></i>
                        </button>

                        <Link
                            href="/"
                            className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition flex items-center gap-2"
                        >
                            Open IDE
                            <i className="ph ph-arrow-right"></i>
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
