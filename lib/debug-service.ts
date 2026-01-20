export interface DebugSession {
  id: string
  type: 'node' | 'python' | 'chrome'
  status: 'stopped' | 'running' | 'paused'
  breakpoints: Array<{ file: string; line: number; verified: boolean }>
  variables: Array<{ name: string; value: string; type: string }>
  callStack: Array<{ name: string; file: string; line: number }>
}

export interface DebugConfiguration {
  type: string
  name: string
  request: 'launch' | 'attach'
  program?: string
  args?: string[]
  port?: number
  url?: string
}

export class DebugService {
  private static instance: DebugService
  private currentSession: DebugSession | null = null

  static getInstance(): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService()
    }
    return DebugService.instance
  }

  async startDebugSession(config: DebugConfiguration): Promise<DebugSession> {
    try {
      const response = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          type: config.type,
          file: config.program || 'main.js',
          args: config.args || []
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      if (result.success && result.session) {
        this.currentSession = result.session as DebugSession
        return this.currentSession
      }
      
      throw new Error(result.error || 'Failed to start debug session')
    } catch (error) {
      console.error('Debug service error:', error)
      throw error
    }
  }

  async stopDebugSession(): Promise<void> {
    if (!this.currentSession) return

    await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stop',
        sessionId: this.currentSession.id
      })
    })

    this.currentSession = null
  }

  async pauseExecution(): Promise<DebugSession> {
    if (!this.currentSession) throw new Error('No active debug session')

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pause',
        sessionId: this.currentSession.id
      })
    })

    const result = await response.json()
    if (result.success && result.session) {
      this.currentSession = result.session as DebugSession
      return this.currentSession
    }
    throw new Error(result.error)
  }

  async continueExecution(): Promise<DebugSession> {
    if (!this.currentSession) throw new Error('No active debug session')

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'continue',
        sessionId: this.currentSession.id
      })
    })

    const result = await response.json()
    if (result.success && result.session) {
      this.currentSession = result.session as DebugSession
      return this.currentSession
    }
    throw new Error(result.error)
  }

  async stepOver(): Promise<DebugSession> {
    if (!this.currentSession) throw new Error('No active debug session')

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stepOver',
        sessionId: this.currentSession.id
      })
    })

    const result = await response.json()
    if (result.success && result.session) {
      this.currentSession = result.session as DebugSession
      return this.currentSession
    }
    throw new Error(result.error)
  }

  async stepInto(): Promise<DebugSession> {
    if (!this.currentSession) throw new Error('No active debug session')

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stepInto',
        sessionId: this.currentSession.id
      })
    })

    const result = await response.json()
    if (result.success && result.session) {
      this.currentSession = result.session as DebugSession
      return this.currentSession
    }
    throw new Error(result.error)
  }

  async stepOut(): Promise<DebugSession> {
    if (!this.currentSession) {
      // Try to recover session or create a new one
      throw new Error('No active debug session - please start debugging first')
    }

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stepOut',
        sessionId: this.currentSession.id
      })
    })

    const result = await response.json()
    if (result.success && result.session) {
      this.currentSession = result.session as DebugSession
      return this.currentSession
    }
    
    // If session not found, clear current session
    if (result.error === 'Session not found') {
      this.currentSession = null
    }
    
    throw new Error(result.error || 'Step out failed')
  }

  async setBreakpoint(file: string, line: number): Promise<void> {
    if (!this.currentSession) throw new Error('No active debug session')

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setBreakpoint',
        sessionId: this.currentSession.id,
        file,
        line
      })
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  async removeBreakpoint(file: string, line: number): Promise<void> {
    if (!this.currentSession) throw new Error('No active debug session')

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'removeBreakpoint',
        sessionId: this.currentSession.id,
        file,
        line
      })
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  async evaluateExpression(expression: string): Promise<{ result: string; type: string }> {
    if (!this.currentSession) throw new Error('No active debug session')

    const response = await fetch('/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate',
        sessionId: this.currentSession.id,
        expression
      })
    })

    const result = await response.json()
    if (result.success) {
      return { result: result.result, type: result.type }
    }
    throw new Error(result.error)
  }

  async getSession(sessionId: string): Promise<DebugSession | null> {
    const response = await fetch(`/api/debug?sessionId=${sessionId}`)
    const result = await response.json()
    return result.session || null
  }

  getCurrentSession(): DebugSession | null {
    return this.currentSession
  }

  isDebugging(): boolean {
    return this.currentSession !== null
  }
}