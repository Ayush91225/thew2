'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIDEStore } from '@/stores/ide-store-new'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/Logo'

type LoginStep = 'email' | 'credentials' | 'invite' | 'accept-invite'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState<any>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, checkInvite, acceptInvite } = useIDEStore()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Check if user has pending invite
      const pendingInvite = await checkInvite(email)

      if (pendingInvite) {
        // User has invite - show invite acceptance flow
        setInvite(pendingInvite)
        setStep('accept-invite')
      } else {
        // No invite - check if existing employee can login
        setStep('credentials')
      }
    } catch (err: any) {
      setError('Error checking account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      // Redirect based on role
      const state = useIDEStore.getState()
      if (state.user?.role === 'OWNER') {
        router.push('/admin')
      } else {
        router.push('/employee')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsLoading(true)

    try {
      await acceptInvite(invite.id, password, name)
      // Now login with provided credentials
      await login(email, password)
      router.push('/employee')
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite')
    } finally {
      setIsLoading(false)
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
            <p className="text-sm text-zinc-400">
              {step === 'email' && 'Sign in to your account'}
              {step === 'credentials' && 'Enter your password'}
              {step === 'accept-invite' && 'Accept your team invite'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Email Entry Step */}
            {step === 'email' && (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
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

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors shadow-lg"
                >
                  {isLoading ? 'Checking...' : 'Continue'}
                </motion.button>

                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-xs text-zinc-400">Don't have an account?</p>
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold mt-2 transition-colors"
                  >
                    Create company and sign up
                  </button>
                </div>
              </motion.form>
            )}

            {/* Credentials Step - Existing employee */}
            {step === 'credentials' && (
              <motion.form
                key="credentials-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <i className="ph ph-user-circle text-purple-400 text-xl"></i>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Signing in as</p>
                      <p className="text-sm font-semibold text-white">{email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('')
                      setPassword('')
                      setStep('email')
                    }}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Change
                  </button>
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
                  disabled={isLoading}
                  className="w-full py-3 mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-lg transition-colors shadow-lg"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </motion.button>
              </motion.form>
            )}

            {/* Accept Invite Step */}
            {step === 'accept-invite' && invite && (
              <motion.form
                key="invite-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleAcceptInvite}
                className="space-y-4"
              >
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
                  <div className="flex gap-3">
                    <i className="ph ph-info text-blue-400 text-xl flex-shrink-0 mt-0.5"></i>
                    <div className="text-sm text-blue-300">
                      <p className="font-semibold mb-1">{invite.companyName}</p>
                      <p className="text-xs">You have been invited to join this company</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Your Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
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
                  disabled={isLoading}
                  className="w-full py-3 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors shadow-lg"
                >
                  {isLoading ? 'Creating Account...' : 'Accept Invite & Sign In'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('')
                    setPassword('')
                    setName('')
                    setInvite(null)
                    setStep('email')
                  }}
                  className="w-full text-xs text-zinc-400 hover:text-white transition-colors py-2"
                >
                  Back
                </button>
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
