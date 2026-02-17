/**
 * Backend-driven Authentication Service
 * Frontend consumes backend-verified auth state only
 * Backend is the single source of truth
 */

import { User } from '@/types/auth'

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export class AuthService {
  private static instance: AuthService
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  }
  private listeners: ((state: AuthState) => void)[] = []

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('kriya-auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.authState = {
          isAuthenticated: parsed.isAuthenticated,
          user: parsed.user,
          token: parsed.token
        }
        
        // Verify token with backend on load
        if (this.authState.token) {
          this.verifyToken(this.authState.token).catch(() => {
            this.logout()
          })
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error)
      this.logout()
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('kriya-auth', JSON.stringify(this.authState))
    } catch (error) {
      console.error('Failed to save auth state:', error)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState))
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * Admin Registration - Creates company and OWNER user
   * Backend is single source of truth
   */
  async registerAdmin(email: string, password: string, name: string, companyName: string): Promise<User> {
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

      // Store token and user from backend
      this.authState = {
        isAuthenticated: true,
        user: data.user,
        token: data.token
      }

      this.saveToStorage()
      this.notifyListeners()

      return data.user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Employee Login - Only users with accepted invites can login
   * Backend verifies credentials and invite status
   */
  async login(email: string, password: string): Promise<User> {
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

      // Store token and user from backend
      this.authState = {
        isAuthenticated: true,
        user: data.user,
        token: data.token
      }

      this.saveToStorage()
      this.notifyListeners()

      return data.user
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Check if user has pending invite
   * Backend returns invite details
   */
  async checkInvite(email: string): Promise<any> {
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
  }

  /**
   * Accept team invite and create employee account
   * Backend creates user and marks invite as accepted
   */
  async acceptInvite(inviteId: string, password: string, name: string): Promise<User> {
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

      return data.user
    } catch (error) {
      console.error('Invite acceptance error:', error)
      throw error
    }
  }

  /**
   * Verify JWT token with backend
   * Backend is source of truth for user validity
   */
  async verifyToken(token: string): Promise<User> {
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

      // Update state with verified user data
      this.authState = {
        isAuthenticated: true,
        user: data.user,
        token
      }

      this.saveToStorage()
      this.notifyListeners()

      return data.user
    } catch (error) {
      console.error('Token verification error:', error)
      throw error
    }
  }

  logout(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    }
    
    localStorage.removeItem('kriya-auth')
    this.notifyListeners()
  }

  /**
   * Create team invites (OWNER only)
   * Backend validates ownership and creates invites
   */
  async createTeamInvites(emails: string[]): Promise<any> {
    try {
      if (!this.authState.token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/auth/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authState.token}`
        },
        body: JSON.stringify({
          action: 'create',
          emails
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create invites')
      }

      return data.invites
    } catch (error) {
      console.error('Error creating team invites:', error)
      throw error
    }
  }

  hasRole(role: 'OWNER' | 'EMPLOYEE'): boolean {
    return this.authState.user?.role === role
  }

  isOwner(): boolean {
    return this.authState.user?.role === 'OWNER'
  }

  isEmployee(): boolean {
    return this.authState.user?.role === 'EMPLOYEE'
  }

  getCompanyId(): string | null {
    return this.authState.user?.companyId || null
  }

  getUser(): User | null {
    return this.authState.user || null
  }

  getToken(): string | null {
    return this.authState.token || null
  }
}