'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIDEStore } from '@/stores/ide-store-new'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'initial' | 'form'>('initial')
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { registerAdmin } = useIDEStore()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      setError('Company name is required')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Valid email is required')
      return false
    }
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await registerAdmin(
        formData.email,
        formData.password,
        formData.name,
        formData.companyName
      )
      // Redirect to admin dashboard after successful registration
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
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
            <p className="text-sm text-zinc-400">Create your company account</p>
          </div>

          {step === 'initial' ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <p className="text-zinc-400 text-sm mb-6">Create a new company and become the owner (OWNER role)</p>
              
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('form')}
                  className="w-full p-5 bg-gradient-to-br from-blue-600/10 to-blue-600/5 hover:from-blue-600/20 hover:to-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                      <i className="ph ph-plus text-2xl text-blue-400"></i>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-base font-semibold text-white">Create New Company</h3>
                      <p className="text-xs text-zinc-400">Set up your company and become owner</p>
                    </div>
                    <i className="ph ph-caret-right text-zinc-600 group-hover:text-blue-400 transition-colors"></i>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push('/login')}
                  className="w-full p-4 bg-zinc-900/40 border border-white/10 rounded-xl hover:border-white/20 transition-colors flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-800/30 flex items-center justify-center">
                    <i className="ph ph-shield-check text-2xl text-purple-400"></i>
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-base font-semibold text-white">Sign in as Admin</h3>
                    <p className="text-xs text-zinc-400">Use your admin (OWNER) credentials to access the admin panel</p>
                  </div>
                  <i className="ph ph-caret-right text-zinc-600 group-hover:text-blue-400 transition-colors"></i>
                </motion.button>
              </div>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-xs text-zinc-400">Already have an account?</p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-400 hover:text-blue-300 text-xs font-semibold mt-2 transition-colors"
                >
                  Sign in instead
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <i className="ph ph-plus text-blue-400 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Creating</p>
                    <p className="text-sm font-semibold text-white">New Company</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('initial')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Back
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Your Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
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
                {isLoading ? 'Creating Account...' : 'Create Company & Account'}
              </motion.button>
            </motion.form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-6">© 2024 KRIYA. All rights reserved.</p>
      </motion.div>
    </div>
  )
}
