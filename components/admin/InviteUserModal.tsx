'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InviteUserModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('employee')
    const [team, setTeam] = useState('Engineering')
    const [isSending, setIsSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleInvite = async () => {
        if (!email) return;

        setIsSending(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSending(false)
        setSent(true)

        // Reset after showing success
        setTimeout(() => {
            setSent(false)
            setEmail('')
            onClose()
        }, 2000)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto relative overflow-hidden">
                            {/* Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <i className="ph ph-envelope-simple-open text-blue-400"></i>
                                Invite Team Member
                            </h2>
                            <p className="text-sm text-zinc-400 mb-6">Send an invitation link to join the workspace.</p>

                            {!sent ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="colleague@kriya.dev"
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-zinc-600"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Role</label>
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-white/20 appearance-none cursor-pointer"
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="project_head">Project Head</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Team</label>
                                            <select
                                                value={team}
                                                onChange={(e) => setTeam(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-white/20 appearance-none cursor-pointer"
                                            >
                                                <option value="Engineering">Engineering</option>
                                                <option value="Design">Design</option>
                                                <option value="Product">Product</option>
                                                <option value="Marketing">Marketing</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleInvite}
                                            disabled={!email || isSending}
                                            className={`px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isSending ? 'animate-pulse' : ''}
                                `}
                                        >
                                            {isSending ? 'Sending...' : 'Send Invite'}
                                            {!isSending && <i className="ph ph-paper-plane-right"></i>}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 mb-4 animate-bounce">
                                        <i className="ph ph-check text-3xl"></i>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Invitation Sent!</h3>
                                    <p className="text-zinc-500 text-sm">We've sent an email to <span className="text-white">{email}</span></p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
