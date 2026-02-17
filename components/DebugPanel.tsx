'use client'

import React, { useState } from 'react'
import { useIDEStore } from '../stores/ide-store-new'

export default function DebugPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const { user, logout } = useIDEStore()

    if (process.env.NODE_ENV === 'production') return null

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 flex items-center justify-center hover:bg-red-500/30 transition shadow-lg"
                title="Debug Menu"
            >
                <i className="ph ph-bug"></i>
            </button>

            {isOpen && (
                <div className="absolute bottom-10 left-0 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-3 border-b border-white/10 bg-zinc-800/50">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Debug Controls</h3>
                    </div>

                    <div className="p-3 space-y-3">
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Current User</div>
                            <div className="text-sm text-white font-mono break-all">
                                {user ? `${user.name} (${user.role})` : 'Not Logged In'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Note</div>
                            <div className="text-[11px] text-zinc-400">
                                Login with existing credentials to switch roles
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full px-3 py-2 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded flex items-center gap-2 border border-red-500/20 transition"
                        >
                            <i className="ph ph-sign-out"></i>
                            Force Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
