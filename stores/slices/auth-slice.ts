import { StateCreator } from 'zustand'
import { User, UserRole } from '../../types/auth'

export interface AuthSlice {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (userData: User) => void
    logout: () => void
    checkAuth: () => Promise<void>
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false, // Don't block app loading

    login: (userData: User) => {
        set({ user: userData, isAuthenticated: true, isLoading: false })
    },

    logout: () => {
        set({ user: null, isAuthenticated: false, isLoading: false })
        // Optional: Call logout API here if needed
    },

    checkAuth: async () => {
        // In a real app, verify token with backend
        // For now, relies on persistence or manual re-login
        set({ isLoading: false })
    }
})
