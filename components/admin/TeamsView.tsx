'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/stores/admin-store'
import InviteUserModal from './InviteUserModal'

interface TeamsViewProps {
    teams: any[]
    selectedTeam: any
    setSelectedTeam: (team: any) => void
}

export default function TeamsView({ teams, selectedTeam, setSelectedTeam }: TeamsViewProps) {
    const router = useRouter()
    const { addTeam, deleteTeam } = useAdminStore()
    const [showCreate, setShowCreate] = useState(false)
    const [showInvite, setShowInvite] = useState(false)
    const [newTeam, setNewTeam] = useState({ 
        name: '', 
        description: '', 
        members: [] as any[], 
        mode: 'SOLO' as 'LIVE' | 'SOLO',
        workspace: {
            id: 'temp-workspace',
            teamId: 'temp-team-id',
            files: [],
            activeFiles: [],
            sharedState: { 
                mode: 'SOLO' as 'LIVE' | 'SOLO',
                activeMembers: []
            }
        },
        lastActivity: new Date().toISOString()
    })
    const [searchTerm, setSearchTerm] = useState('')

    const handleOpenIDE = (team: any) => {
        // Store team context and navigate to IDE
        localStorage.setItem('activeTeam', JSON.stringify(team))
        router.push(`/ide?team=${team.id}&mode=${team.mode}`)
    }

    const handleCreate = () => {
        if (newTeam.name && newTeam.description) {
            addTeam(newTeam)
            setNewTeam({ 
                name: '', 
                description: '', 
                members: [], 
                mode: 'SOLO',
                workspace: {
                    id: 'temp-workspace',
                    teamId: 'temp-team-id',
                    files: [],
                    activeFiles: [],
                    sharedState: { 
                        mode: 'SOLO',
                        activeMembers: []
                    }
                },
                lastActivity: new Date().toISOString()
            })
            setShowCreate(false)
        }
    }

    const handleDelete = (id: string) => {
        deleteTeam(id)
        if (selectedTeam?.id === id) setSelectedTeam(null)
    }

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    }

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

                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition flex items-center gap-2 shadow-lg shadow-white/5"
                >
                    <i className="ph ph-plus-circle text-lg"></i>
                    Create Team
                </button>
                <button
                    className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition flex items-center gap-2 border border-white/5"
                    onClick={() => setShowInvite(true)}
                >
                    <i className="ph ph-envelope-simple text-lg"></i>
                    Invite User
                </button>
            </div>

            {showCreate && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass border border-white/10 rounded-xl p-6 overflow-hidden"
                >
                    <h3 className="font-semibold mb-4 text-white">New Team Configuration</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder="Team Name"
                            value={newTeam.name}
                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                            className="bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-white/30 outline-none"
                        />
                        <input
                            placeholder="Description (e.g. Payments Module)"
                            value={newTeam.description}
                            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                            className="bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-white/30 outline-none"
                        />
                        <select
                            value={newTeam.mode}
                            onChange={(e) => {
                                const mode = e.target.value as 'LIVE' | 'SOLO'
                                setNewTeam({ 
                                    ...newTeam, 
                                    mode,
                                    workspace: {
                                        ...newTeam.workspace,
                                        sharedState: { 
                                            mode,
                                            activeMembers: []
                                        }
                                    }
                                })
                            }}
                            className="bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
                        >
                            <option value="SOLO">SOLO Mode</option>
                            <option value="LIVE">LIVE Mode (Realtime)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!newTeam.name || !newTeam.description}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Team
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="flex-1 glass border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <div className="grid grid-cols-[3fr_2fr_1fr_1fr_1fr_1fr] px-6 py-4 bg-white/5 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    <div>Team Name</div>
                    <div>Description</div>
                    <div>Mode</div>
                    <div>Members</div>
                    <div>IDE Access</div>
                    <div className="text-right">Actions</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col"
                    >
                        {filteredTeams.length === 0 ? (
                            <div className="p-10 text-center text-zinc-500">
                                No teams found matching your search.
                            </div>
                        ) : (
                            filteredTeams.map(team => (
                                <motion.div
                                    key={team.id}
                                    variants={item}
                                    onClick={() => setSelectedTeam(team)}
                                    className="grid grid-cols-[3fr_2fr_1fr_1fr_1fr_1fr] px-6 py-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group items-center"
                                >
                                    <div>
                                        <div className="font-semibold text-white">{team.name}</div>
                                        <div className="text-xs text-zinc-500 mt-1" suppressHydrationWarning>
                                            Created {new Date(team.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-sm text-zinc-400">{team.description}</div>
                                    <div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                            team.workspace.sharedState.mode === 'LIVE'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                        }`}>
                                            {team.workspace.sharedState.mode}
                                        </span>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {team.members.slice(0, 3).map((member: any, i: number) => (
                                            <div 
                                                key={member.id} 
                                                className={`w-8 h-8 rounded-full border-2 border-black overflow-hidden ${
                                                    member.status === 'online' ? 'ring-2 ring-green-400' : ''
                                                }`}
                                                title={`${member.name} (${member.status})`}
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
                                            onClick={(e) => { e.stopPropagation(); handleOpenIDE(team); }}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md transition flex items-center gap-1.5"
                                            title="Open IDE for this team"
                                        >
                                            <i className="ph ph-code text-sm"></i>
                                            Open IDE
                                        </button>
                                    </div>
                                    <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(team.id); }}
                                            className="w-8 h-8 rounded hover:bg-red-500/20 flex items-center justify-center ml-auto transition text-zinc-500 hover:text-red-400"
                                            title="Delete Team"
                                        >
                                            <i className="ph ph-trash text-lg"></i>
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </div>
            </div>

            <InviteUserModal isOpen={showInvite} onClose={() => setShowInvite(false)} />
        </div>
    )
}
