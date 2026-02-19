'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function TeamsSection() {
  const [activeTab, setActiveTab] = useState<'my-teams' | 'invitations'>('my-teams')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header with Search and Actions */}
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

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('my-teams')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 shadow-lg shadow-white/5 ${
              activeTab === 'my-teams'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
            }`}
          >
            <i className="ph ph-users text-lg"></i>
            My Teams
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 shadow-lg shadow-white/5 ${
              activeTab === 'invitations'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
            }`}
          >
            <i className="ph ph-envelope-simple text-lg"></i>
            Invitations
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">0</span>
          </button>
        </div>
      </div>

      {/* My Teams Tab */}
      {activeTab === 'my-teams' && (
        <div className="flex-1 glass border border-white/10 rounded-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-[3fr_2fr_1fr_1fr_1fr] px-6 py-4 bg-white/5 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <div>Team Name</div>
            <div>Description</div>
            <div>Mode</div>
            <div>Members</div>
            <div>IDE Access</div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-10 text-center text-zinc-500">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ph ph-users text-zinc-600 text-3xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-zinc-400 mb-2">No Teams Yet</h4>
              <p className="text-zinc-600 text-sm max-w-md mx-auto">
                You're not part of any teams yet. Wait for an invitation from your admin or request to join a team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="flex-1 glass border border-white/10 rounded-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-[3fr_2fr_1fr_1fr] px-6 py-4 bg-white/5 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <div>Team Name</div>
            <div>Invited By</div>
            <div>Date</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-10 text-center text-zinc-500">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ph ph-envelope-simple text-zinc-600 text-3xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-zinc-400 mb-2">No Pending Invitations</h4>
              <p className="text-zinc-600 text-sm max-w-md mx-auto">
                You don't have any pending team invitations at the moment. Check back later.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
