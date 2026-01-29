'use client'

import React, { useState, useEffect } from 'react'
import KriyaLogo from '../../components/logo/KriyaLogo'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, UserRole, MOCK_USERS } from '../../types/auth'
import { useIDEStore } from '../../stores/ide-store-new'

export default function LoginPage() {
    const router = useRouter()
    const login = useIDEStore((state) => state.login)
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const handleLogin = async (role: UserRole) => {
        setIsLoading(true)
        setError('')
        setSelectedRole(role)

        try {
            const mockUser = MOCK_USERS[role]
            // Simulate network delay for effect
            await new Promise(resolve => setTimeout(resolve, 800))

            const password = role === 'admin' ? 'admin123' :
                role === 'project_head' ? 'head123' : 'emp123'

            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: mockUser.email,
                    password: password
                })
            })

            const data = await res.json()

            if (data.success && data.user) {
                login(data.user)
                if (data.user.role === 'admin') {
                    router.push('/admin')
                } else if (data.user.role === 'employee') {
                    router.push('/employee')
                } else {
                    router.push('/ide')
                }
            } else {
                setError('Login failed')
                setIsLoading(false)
                setSelectedRole(null)
            }
        } catch (err) {
            setError('An error occurred during login')
            setIsLoading(false)
            setSelectedRole(null)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden relative selection:bg-blue-500/30">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"
                    style={{
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"
                    style={{
                        transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`
                    }}
                />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-md"
            >
                <div className="glass border-[0.5px] border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl bg-black/40">
                    <motion.div variants={itemVariants} className="text-center mb-10">
                        <KriyaLogo className="w-16 h-16 mx-auto mb-6 shadow-lg shadow-white/5" />
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-zinc-400 text-sm">Select your identity to access the workspace</p>
                    </motion.div>

                    <div className="space-y-3">
                        {(Object.entries(MOCK_USERS) as [UserRole, User][]).map(([role, user]) => (
                            <motion.button
                                key={role}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleLogin(role)}
                                disabled={isLoading}
                                className={`w-full p-3 rounded-xl border transition-all duration-300 flex items-center gap-4 group relative overflow-hidden
                                    ${isLoading && selectedRole !== role ? 'opacity-30 blur-sm' : ''}
                                    ${selectedRole === role
                                        ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                        : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
                                    }
                                `}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-300
                                    ${selectedRole === role ? 'border-blue-500/30' : 'border-white/10 bg-zinc-800'}
                                `}>
                                    <img src={user.avatar} alt={role} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className={`font-medium text-sm transition-colors ${selectedRole === role ? 'text-blue-400' : 'text-zinc-200 group-hover:text-white'}`}>
                                        {user.name}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                                        {role.replace('_', ' ')}
                                    </div>
                                </div>

                                {selectedRole === role && isLoading ? (
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <i className="ph ph-arrow-right text-zinc-600 group-hover:text-white transition-colors duration-300 text-sm" />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-dashed border-white/10 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">System Online</span>
                        </div>
                        <p className="text-[10px] text-zinc-600">Enterprise Guard v2.0.0 • Secure Connection</p>
                    </motion.div>
                </div>

                <motion.div
                    variants={itemVariants}
                    className="text-center mt-6 text-zinc-600 text-xs hover:text-zinc-500 transition-colors cursor-pointer"
                >
                    Need help? Contact support
                </motion.div>
            </motion.div>
        </div>
    )
}
