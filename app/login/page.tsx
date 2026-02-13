'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIDEStore } from '@/stores/ide-store-new'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'admin' | 'employee' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useIDEStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password && selectedRole) {
      login({
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        avatar: '/avatar.png',
        role: selectedRole,
        permissions: selectedRole === 'admin' ? ['all'] : ['read', 'write']
      })
      router.push(selectedRole === 'admin' ? '/admin' : '/employee')
    }
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Logo className="w-12 h-12" />
              <h1 className="text-3xl font-bold text-white">KRIYA v2.0</h1>
            </div>
            <p className="text-sm text-zinc-400">Enterprise Cloud Development Environment</p>
          </div>

          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <p className="text-zinc-400 text-sm mb-6">Select your role to continue</p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole('admin')}
                  className="w-full p-5 bg-gradient-to-br from-blue-600/10 to-blue-600/5 hover:from-blue-600/20 hover:to-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                      <i className="ph ph-shield-check text-2xl text-blue-400"></i>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-base font-semibold text-white">Administrator</h3>
                      <p className="text-xs text-zinc-400">Full system access and management</p>
                    </div>
                    <i className="ph ph-caret-right text-zinc-600 group-hover:text-blue-400 transition-colors"></i>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole('employee')}
                  className="w-full p-5 bg-gradient-to-br from-purple-600/10 to-purple-600/5 hover:from-purple-600/20 hover:to-purple-600/10 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                      <i className="ph ph-user-circle text-2xl text-purple-400"></i>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-base font-semibold text-white">Employee</h3>
                      <p className="text-xs text-zinc-400">Access workspace and projects</p>
                    </div>
                    <i className="ph ph-caret-right text-zinc-600 group-hover:text-purple-400 transition-colors"></i>
                  </div>
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${selectedRole === 'admin' ? 'bg-blue-600/20' : 'bg-purple-600/20'} flex items-center justify-center`}>
                      <i className={`ph ${selectedRole === 'admin' ? 'ph-shield-check text-blue-400' : 'ph-user-circle text-purple-400'} text-xl`}></i>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Signing in as</p>
                      <p className="text-sm font-semibold text-white capitalize">{selectedRole}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className={`w-full py-3 mt-6 ${selectedRole === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-semibold rounded-lg transition-colors shadow-lg`}
                >
                  Sign In
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-6">© 2024 KRIYA. All rights reserved.</p>
      </motion.div>
    </div>
  )
}
