'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIDEStore } from '@/stores/ide-store-new'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useIDEStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      login({ 
        id: Date.now().toString(),
        email, 
        name: email.split('@')[0], 
        avatar: '/avatar.png',
        role: 'developer' as const
      })
      router.push('/ide')
    }
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">Login to KRIYA</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
