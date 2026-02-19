'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIDEStore } from '@/stores/ide-store-new'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/Logo'
import { Oswald } from 'next/font/google'

const oswald = Oswald({ subsets: ['latin'], weight: ['200', '300', '400', '500', '600', '700'] })

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
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="h-screen bg-black flex relative overflow-hidden">
      {/* Left Side - Logo & Description */}
      <div className="w-[55%] flex items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <Logo className="w-20 h-20" />
            <h1 className="text-5xl font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>KRIYA</h1>
          </div>
          <h2 className={`text-3xl font-bold text-white mb-4 ${oswald.className}`}>Secure Access to Your Organization</h2>
          <p className={`text-lg text-zinc-400 leading-relaxed mb-6 ${oswald.className}`}>
            Authorized access to your KRIYA workspace with secure authentication and trusted access management.
          </p>
          <div className={`space-y-3 text-zinc-400 ${oswald.className}`}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Secure access & Unified workspace</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Authorized users</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Centralized environment</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className={`w-[45%] flex items-center justify-center p-12 border-l border-white/10 ${oswald.className}`}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
            <p className="text-sm text-zinc-400">
              {step === 'email' && 'Sign in to your workspace'}
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
                    placeholder={isAdminMode ? "admin@company.com" : "name@company.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold rounded-lg transition-colors shadow-lg"
                >
                  {isLoading ? 'Checking...' : 'Continue'}
                </motion.button>

                <div className="text-center pt-4 border-t border-white/10 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-400">Don't have an account?</p>
                    <button
                      type="button"
                      onClick={() => router.push('/register')}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold mt-1 transition-colors"
                    >
                      Create company and sign up
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {!isAdminMode ? (
                      <motion.div
                        key="admin-login"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="pt-2"
                      >
                        <button
                          type="button"
                          onClick={() => setIsAdminMode(true)}
                          className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                        >
                          Login as Admin →
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="employee-login"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="pt-2"
                      >
                        <button
                          type="button"
                          onClick={() => setIsAdminMode(false)}
                          className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                        >
                          ← Back to Employee Login
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <i className={`ph ${showPassword ? 'ph-eye-slash' : 'ph-eye'} text-lg`}></i>
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold rounded-lg transition-colors shadow-lg"
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
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <i className={`ph ${showPassword ? 'ph-eye-slash' : 'ph-eye'} text-lg`}></i>
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold rounded-lg transition-colors shadow-lg"
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

          <p className="text-center text-xs text-zinc-600 mt-6">© 2026 KRIYA. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  )
}
