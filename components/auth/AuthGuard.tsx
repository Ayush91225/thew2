'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIDEStore } from '../../stores/ide-store-new'
import { UserRole } from '../../types/auth'

interface AuthGuardProps {
    children: React.ReactNode
    requiredRole?: UserRole
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated } = useIDEStore()

    useEffect(() => {
        // Skip check if already on login page
        if (pathname === '/login') return

        // Redirect to login if not authenticated
        if (!isAuthenticated || !user) {
            router.push('/login')
            return
        }
        
        // Check role permissions
        if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
            alert('You do not have permission to access this page')
            router.push('/')
        }
    }, [user, isAuthenticated, router, pathname, requiredRole])

    // Don't render children if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}
