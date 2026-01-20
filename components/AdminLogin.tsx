'use client'

import { useState } from 'react'
import { LockKey, User } from 'phosphor-react'

interface AdminLoginProps {
  onLogin: (credentials: { email: string; password: string }) => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin({ email, password })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Kriya Admin</h1>
          <p className="text-zinc-400 text-sm">Sign in to access the admin dashboard</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:border-white/20 focus:outline-none"
                  placeholder="admin@kriya.dev"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:border-white/20 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
