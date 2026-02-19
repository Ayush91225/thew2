'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIDEStore } from '@/stores/ide-store-new'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import { Oswald } from 'next/font/google'

const oswald = Oswald({ subsets: ['latin'], weight: ['200', '300', '400', '500', '600', '700'] })

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
          <h2 className={`text-3xl font-bold text-white mb-4 ${oswald.className}`}>Build, Collaborate, and Deploy from One Place</h2>
          <p className={`text-lg text-zinc-400 leading-relaxed mb-6 ${oswald.className}`}>
            Build, collaborate, and deploy with a modern IDE designed for teams. 
            Experience seamless development with AI assistance, real-time collaboration, 
            and powerful cloud integration.
          </p>
          <div className={`space-y-3 text-zinc-400 ${oswald.className}`}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>AI-powered code assistance</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Real-time team collaboration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Cloud-native development</span>
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
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
            <p className="text-sm text-zinc-400">Create your company workspace and get started with secure, collaborative development.</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Company Name</label>
              <input
                type="text"
                name="companyName"
                placeholder="Acme Corporation"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
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
                className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
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
                className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleInputChange}
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

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <i className={`ph ${showConfirmPassword ? 'ph-eye-slash' : 'ph-eye'} text-lg`}></i>
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
              {isLoading ? 'Creating Account...' : 'Create Company & Account'}
            </motion.button>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-xs text-zinc-400">Already have an account?</p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold mt-2 transition-colors"
              >
                Sign in instead
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-zinc-600 mt-6">© 2026 KRIYA. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  )
}
