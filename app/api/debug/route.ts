import { NextRequest, NextResponse } from 'next/server'

interface DebugSession {
  id: string
  type: 'node' | 'python' | 'chrome'
  status: 'stopped' | 'running' | 'paused'
  breakpoints: Array<{ file: string; line: number; verified: boolean }>
  variables: Array<{ name: string; value: string; type: string }>
  callStack: Array<{ name: string; file: string; line: number }>
}

const sessions = new Map<string, DebugSession>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, ...params } = body

    switch (action) {
      case 'start':
        return handleStart(params)
      case 'stop':
        return handleStop(sessionId)
      case 'pause':
        return handlePause(sessionId)
      case 'continue':
        return handleContinue(sessionId)
      case 'stepOver':
        return handleStepOver(sessionId)
      case 'stepInto':
        return handleStepInto(sessionId)
      case 'stepOut':
        return handleStepOut(sessionId)
      case 'setBreakpoint':
        return handleSetBreakpoint(sessionId, params)
      case 'removeBreakpoint':
        return handleRemoveBreakpoint(sessionId, params)
      case 'evaluate':
        return handleEvaluate(sessionId, params)
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Debug request failed', details: error }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      const session = sessions.get(sessionId)
      return NextResponse.json({ session })
    }

    return NextResponse.json({ sessions: Array.from(sessions.values()) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 })
  }
}

async function handleStart({ type = 'node', file = 'main.js', args = [] }: { type?: string; file?: string; args?: string[] }) {
  const sessionId = `debug-${Date.now()}`
  
  const session: DebugSession = {
    id: sessionId,
    type: type as 'node' | 'python' | 'chrome',
    status: 'running',
    breakpoints: [],
    variables: [
      { name: 'x', value: '10', type: 'number' },
      { name: 'message', value: '"Hello World"', type: 'string' },
      { name: 'isActive', value: 'true', type: 'boolean' }
    ],
    callStack: [
      { name: 'main', file: file || 'main.js', line: 1 }
    ]
  }

  sessions.set(sessionId, session)

  // Simulate debug start delay
  setTimeout(() => {
    const currentSession = sessions.get(sessionId)
    if (currentSession) {
      currentSession.status = 'paused'
    }
  }, 500)

  return NextResponse.json({ 
    success: true, 
    sessionId,
    session,
    message: `Debug session started for ${type}` 
  })
}

async function handleStop(sessionId: string) {
  sessions.delete(sessionId)
  return NextResponse.json({ success: true, message: 'Debug session stopped' })
}

async function handlePause(sessionId: string) {
  const session = sessions.get(sessionId)
  if (session) {
    session.status = 'paused'
    return NextResponse.json({ success: true, session })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

async function handleContinue(sessionId: string) {
  const session = sessions.get(sessionId)
  if (session) {
    session.status = 'running'
    return NextResponse.json({ success: true, session })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

async function handleStepOver(sessionId: string) {
  const session = sessions.get(sessionId)
  if (session && session.callStack.length > 0) {
    session.callStack[0].line += 1
    session.status = 'paused'
    return NextResponse.json({ success: true, session })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

async function handleStepInto(sessionId: string) {
  const session = sessions.get(sessionId)
  if (session) {
    session.callStack.unshift({
      name: 'function',
      file: session.callStack[0]?.file || '',
      line: (session.callStack[0]?.line || 0) + 1
    })
    session.status = 'paused'
    return NextResponse.json({ success: true, session })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

async function handleStepOut(sessionId: string) {
  const session = sessions.get(sessionId)
  if (session && session.callStack.length > 1) {
    session.callStack.shift()
    session.status = 'paused'
    return NextResponse.json({ success: true, session })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

async function handleSetBreakpoint(sessionId: string, { file, line }: { file: string; line: number }) {
  const session = sessions.get(sessionId)
  if (session) {
    const breakpoint = { file, line, verified: true }
    session.breakpoints.push(breakpoint)
    return NextResponse.json({ success: true, breakpoint })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

async function handleRemoveBreakpoint(sessionId: string, { file, line }: { file: string; line: number }) {
  const session = sessions.get(sessionId)
  if (session) {
    session.breakpoints = session.breakpoints.filter(bp => !(bp.file === file && bp.line === line))
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

async function handleEvaluate(sessionId: string, { expression }: { expression: string }) {
  const session = sessions.get(sessionId)
  if (session) {
    let result = 'undefined'
    
    if (expression === 'x') result = '10'
    else if (expression === 'message') result = '"Hello World"'
    else if (expression === 'isActive') result = 'true'
    else if (expression.includes('+')) {
      const parts = expression.split('+').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
      if (parts.length === 2) result = (parts[0] + parts[1]).toString()
    }
    
    return NextResponse.json({ success: true, result, type: typeof result })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}