'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIDEStore } from '../../stores/ide-store-new'

interface AuthGuardProps {
    children: React.ReactNode
    requiredRole?: 'OWNER' | 'EMPLOYEE'
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, token, verifyToken } = useIDEStore()
    const [isVerifying, setIsVerifying] = useState(true)

    useEffect(() => {
        const verifyAuth = async () => {
            // Skip check if already on login or register page
            if (pathname === '/login' || pathname === '/register') {
                setIsVerifying(false)
                return
            }

            // Try to verify token with backend
            if (token) {
                try {
                    await verifyToken(token)
                } catch (error) {
                    // Token invalid - redirect to login
                    router.push('/login')
                    return
                }
            }

            // Redirect to login if not authenticated
            if (!isAuthenticated || !user) {
                router.push('/login')
                return
            }
            
            // Check role permissions
            if (requiredRole && user.role !== requiredRole) {
                // Redirect to appropriate dashboard for their role
                if (user.role === 'OWNER') {
                    router.push('/admin')
                } else {
                    router.push('/employee')
                }
                return
            }

            setIsVerifying(false)
        }

        verifyAuth()
    }, [pathname, isAuthenticated, user, token, requiredRole, router, verifyToken])

    // Show loading while verifying
    if (isVerifying) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Verifying with server...</p>
                </div>
            </div>
        )
    }

    // Don't render children if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-400">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
