'use client'

import { useState } from 'react'
import KriyaLogo from '../logo/KriyaLogo'
import { motion, AnimatePresence } from 'framer-motion'
import { useIDEStore } from '@/stores/ide-store-new'
import Link from 'next/link'

interface EmployeeLayoutProps {
    children: React.ReactNode
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
    const { user, logout } = useIDEStore()

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden selection:bg-purple-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden max-w-7xl mx-auto w-full border-x border-white/5 bg-black/20 backdrop-blur-3xl shadow-2xl">
                <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-sm px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <KriyaLogo className="w-8 h-8" />
                        <div className="h-6 w-px bg-white/10 mx-2"></div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Employee Portal</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                <img src={user.avatar} className="w-6 h-6 rounded-full" alt="User" />
                                <span className="text-xs font-medium text-white">{user.name}</span>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                logout()
                                window.location.href = '/login'
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/10 flex items-center justify-center transition border border-white/5"
                            title="Logout"
                        >
                            <i className="ph ph-sign-out text-zinc-400 hover:text-red-400"></i>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
