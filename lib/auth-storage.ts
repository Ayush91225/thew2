// Shared authentication storage
// In production, replace with actual database

// Use a singleton pattern to ensure we never lose data
let _users: Map<string, any> | null = null
let _companies: Map<string, any> | null = null
let _teamInvites: Map<string, any> | null = null
let _teamNotifications: Map<string, any> | null = null

// Reuse existing maps if they exist (prevents data loss on module reload)
// In Next.js dev mode, modules can be re-evaluated, so we cache in global
const globalKey = '__kriya_auth_storage__'
if (typeof global !== 'undefined' && (global as any)[globalKey]) {
  _users = (global as any)[globalKey].users
  _companies = (global as any)[globalKey].companies
  _teamInvites = (global as any)[globalKey].teamInvites
  _teamNotifications = (global as any)[globalKey].teamNotifications
} else {
  _users = new Map<string, any>()
  _companies = new Map<string, any>()
  _teamInvites = new Map<string, any>()
  _teamNotifications = new Map<string, any>()
  
  if (typeof global !== 'undefined') {
    (global as any)[globalKey] = {
      users: _users,
      companies: _companies,
      teamInvites: _teamInvites,
      teamNotifications: _teamNotifications
    }
  }
}

export const users = _users!
export const companies = _companies!
export const teamInvites = _teamInvites!
export const teamNotifications = _teamNotifications!

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function verifyJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      Buffer.from(parts[1] + '==', 'base64').toString()
    )

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

export function constantTimeCompare(input: string, expected: string): boolean {
  if (input.length !== expected.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return result === 0
}
