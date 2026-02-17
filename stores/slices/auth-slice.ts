import { StateCreator } from 'zustand'
import { User } from '../../types/auth'

export interface AuthSlice {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    token: string | null
    error: string | null
    
    // Backend-driven auth methods
    registerAdmin: (email: string, password: string, name: string, companyName: string) => Promise<void>
    login: (email: string, password: string) => Promise<void>
    checkInvite: (email: string) => Promise<any>
    acceptInvite: (inviteId: string, password: string, name: string) => Promise<void>
    verifyToken: (token: string) => Promise<void>
    logout: () => void
    clearError: () => void
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    token: null,
    error: null,

    registerAdmin: async (email: string, password: string, name: string, companyName: string) => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register-admin',
                    email,
                    password,
                    name,
                    companyName
                })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Registration failed')
            }

            // Store token in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }

            set({
                user: data.user,
                isAuthenticated: true,
                token: data.token,
                isLoading: false
            })
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Registration failed'
            })
            throw error
        }
    },

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Login failed')
            }

            // Store token in localStorage for API requests
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }

            set({
                user: data.user,
                isAuthenticated: true,
                token: data.token,
                isLoading: false
            })
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Login failed'
            })
            throw error
        }
    },

    checkInvite: async (email: string) => {
        try {
            const response = await fetch(`/api/auth/invites?email=${encodeURIComponent(email)}`)
            const data = await response.json()

            if (!data.success) {
                return null
            }

            return data.invite
        } catch (error) {
            console.error('Error checking invite:', error)
            return null
        }
    },

    acceptInvite: async (inviteId: string, password: string, name: string) => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch('/api/auth/invites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'accept',
                    inviteId,
                    password,
                    name
                })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Failed to accept invite')
            }

            // Store token in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }

            set({
                user: data.user,
                isLoading: false
            })
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to accept invite'
            })
            throw error
        }
    },

    verifyToken: async (token: string) => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Token verification failed')
            }

            set({
                user: data.user,
                isAuthenticated: true,
                token,
                isLoading: false
            })
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Token verification failed'
            })
            throw error
        }
    },

    logout: () => {
        // Clear from localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            localStorage.removeItem('kriya-auth')
        }
        
        set({
            user: null,
            isAuthenticated: false,
            token: null,
            error: null
        })
    },

    clearError: () => {
        set({ error: null })
    }
})
