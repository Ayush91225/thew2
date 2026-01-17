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
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const handleError = (message: string, status = 500) => 
  NextResponse.json({ error: message }, { status, headers: CORS_HEADERS })

function sanitizeExpression(expr: string): string {
  return expr.replace(/[^a-zA-Z0-9._()[\]]/g, '')
}

function validateSessionId(id: string): boolean {
  return /^debug-\d+$/.test(id)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, ...params } = body

    if (sessionId && !validateSessionId(sessionId)) {
      return handleError('Invalid session ID', 400)
    }

    const handlers = {
      start: () => handleStart(params),
      stop: () => handleStop(sessionId),
      pause: () => handlePause(sessionId),
      continue: () => handleContinue(sessionId),
      stepOver: () => handleStepOver(sessionId),
      stepInto: () => handleStepInto(sessionId),
      stepOut: () => handleStepOut(sessionId),
      setBreakpoint: () => handleSetBreakpoint(sessionId, params),
      removeBreakpoint: () => handleRemoveBreakpoint(sessionId, params),
      evaluate: () => handleEvaluate(sessionId, params)
    }

    const handler = handlers[action as keyof typeof handlers]
    return handler ? handler() : handleError('Unknown action', 400)
  } catch {
    return handleError('Debug request failed')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      if (!validateSessionId(sessionId)) {
        return handleError('Invalid session ID', 400)
      }
      const session = sessions.get(sessionId)
      return NextResponse.json({ session }, { headers: CORS_HEADERS })
    }

    return NextResponse.json({ sessions: Array.from(sessions.values()) }, { headers: CORS_HEADERS })
  } catch {
    return handleError('Failed to get sessions')
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}

function handleStart({ type = 'node', file = 'main.js' }: { type?: string; file?: string }) {
  const sessionId = `debug-${Date.now()}`
  const session: DebugSession = {
    id: sessionId,
    type: type as 'node' | 'python' | 'chrome',
    status: 'paused',
    breakpoints: [],
    variables: getVariables(type),
    callStack: [{ name: 'main', file: file || 'main.js', line: 1 }]
  }

  sessions.set(sessionId, session)
  return NextResponse.json({ success: true, sessionId, session }, { headers: CORS_HEADERS })
}

function getVariables(type: string) {
  const baseVars = [
    { name: 'example', value: '"test"', type: 'string' },
    { name: 'counter', value: '0', type: 'number' }
  ]
  
  if (type === 'node') {
    baseVars.push({ name: 'process.pid', value: process.pid.toString(), type: 'number' })
  }
  
  return baseVars
}

function handleStop(sessionId: string) {
  if (!sessionId) return handleError('Session ID required', 400)
  sessions.delete(sessionId)
  return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
}

function handlePause(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return handleError('Session not found', 404)
  
  session.status = 'paused'
  return NextResponse.json({ success: true, session }, { headers: CORS_HEADERS })
}

function handleContinue(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return handleError('Session not found', 404)
  
  session.status = 'running'
  return NextResponse.json({ success: true, session }, { headers: CORS_HEADERS })
}

function handleStepOver(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return handleError('Session not found', 404)
  
  if (session.callStack.length > 0) {
    session.callStack[0].line += 1
    session.status = 'paused'
  }
  
  return NextResponse.json({ success: true, session }, { headers: CORS_HEADERS })
}

function handleStepInto(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return handleError('Session not found', 404)
  
  const functions = ['initialize', 'processData', 'validateInput']
  const randomFunction = functions[Math.floor(Math.random() * functions.length)]
  
  session.callStack.unshift({
    name: randomFunction,
    file: session.callStack[0]?.file || 'main.js',
    line: 1
  })
  session.status = 'paused'
  
  return NextResponse.json({ success: true, session }, { headers: CORS_HEADERS })
}

function handleStepOut(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return handleError('Session not found', 404)
  
  if (session.callStack.length > 1) {
    session.callStack.shift()
  }
  session.status = 'paused'
  
  return NextResponse.json({ success: true, session }, { headers: CORS_HEADERS })
}

function handleSetBreakpoint(sessionId: string, { file, line }: { file: string; line: number }) {
  const session = sessions.get(sessionId)
  if (!session) return handleError('Session not found', 404)
  
  if (!file || typeof line !== 'number') {
    return handleError('Invalid breakpoint data', 400)
  }
  
  const breakpoint = { file: file.slice(0, 100), line: Math.max(1, line), verified: true }
  session.breakpoints.push(breakpoint)
  
  return NextResponse.json({ success: true, breakpoint }, { headers: CORS_HEADERS })
}

function handleRemoveBreakpoint(sessionId: string, { file, line }: { file: string; line: number }) {
  const session = sessions.get(sessionId)
  if (!session) return handleError('Session not found', 404)
  
  session.breakpoints = session.breakpoints.filter(bp => !(bp.file === file && bp.line === line))
  return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
}

function handleEvaluate(sessionId: string, { expression }: { expression: string }) {
  try {
    const session = sessions.get(sessionId)
    if (!session) return handleError('Session not found', 404)
    
    if (!expression || expression.length > 100) {
      return handleError('Invalid expression', 400)
    }
    
    const sanitized = sanitizeExpression(expression)
    const predefinedResults: Record<string, { result: string; type: string }> = {
      '__dirname': { result: '"/workspace"', type: 'string' },
      'process.pid': { result: process.pid.toString(), type: 'number' },
      'Date.now()': { result: Date.now().toString(), type: 'number' },
      'Math.PI': { result: '3.141592653589793', type: 'number' }
    }
    
    const evaluation = predefinedResults[sanitized] || { result: 'undefined', type: 'undefined' }
    
    return NextResponse.json({ 
      success: true, 
      result: evaluation.result, 
      type: evaluation.type 
    }, { headers: CORS_HEADERS })
  } catch {
    return handleError('Evaluation failed')
  }
}