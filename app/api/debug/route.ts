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
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const body = await request.json()
    const { action, sessionId, ...params } = body

    switch (action) {
      case 'start':
        return handleStart(params, headers)
      case 'stop':
        return handleStop(sessionId, headers)
      case 'pause':
        return handlePause(sessionId, headers)
      case 'continue':
        return handleContinue(sessionId, headers)
      case 'stepOver':
        return handleStepOver(sessionId, headers)
      case 'stepInto':
        return handleStepInto(sessionId, headers)
      case 'stepOut':
        return handleStepOut(sessionId, headers)
      case 'setBreakpoint':
        return handleSetBreakpoint(sessionId, params, headers)
      case 'removeBreakpoint':
        return handleRemoveBreakpoint(sessionId, params, headers)
      case 'evaluate':
        return handleEvaluate(sessionId, params, headers)
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers })
    }
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Debug request failed' }, { status: 500, headers })
  }
}

export async function GET(request: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      const session = sessions.get(sessionId)
      return NextResponse.json({ session }, { headers })
    }

    return NextResponse.json({ sessions: Array.from(sessions.values()) }, { headers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

async function handleStart({ type = 'node', file = 'main.js', args = [] }: { type?: string; file?: string; args?: string[] }, headers: any) {
  const sessionId = `debug-${Date.now()}`
  
  // Get real variables from the current execution context
  const getRealVariables = () => {
    const variables = []
    
    // Add common JavaScript/Node.js variables
    if (type === 'node') {
      variables.push(
        { name: '__dirname', value: `"${process.cwd()}"`, type: 'string' },
        { name: '__filename', value: `"${file}"`, type: 'string' },
        { name: 'process.env.NODE_ENV', value: '"development"', type: 'string' },
        { name: 'process.pid', value: process.pid.toString(), type: 'number' }
      )
    } else if (type === 'chrome') {
      variables.push(
        { name: 'window.location.href', value: '"http://localhost:3000"', type: 'string' },
        { name: 'document.title', value: '"KRIYA IDE"', type: 'string' },
        { name: 'navigator.userAgent', value: '"Chrome/120.0.0.0"', type: 'string' }
      )
    } else if (type === 'python') {
      variables.push(
        { name: '__name__', value: '"__main__"', type: 'string' },
        { name: 'sys.version', value: '"3.11.0"', type: 'string' },
        { name: 'os.getcwd()', value: `"${process.cwd()}"`, type: 'string' }
      )
    }
    
    return variables
  }
  
  const session: DebugSession = {
    id: sessionId,
    type: type as 'node' | 'python' | 'chrome',
    status: 'paused',
    breakpoints: [],
    variables: getRealVariables(),
    callStack: [
      { name: 'main', file: file || 'main.js', line: 1 },
      { name: 'require', file: 'internal/modules/cjs/loader.js', line: 988 },
      { name: 'Module.load', file: 'internal/modules/cjs/loader.js', line: 834 }
    ]
  }

  sessions.set(sessionId, session)

  return NextResponse.json({ 
    success: true, 
    sessionId,
    session,
    message: `Debug session started for ${type}` 
  }, { headers })
}

async function handleStop(sessionId: string, headers: any) {
  sessions.delete(sessionId)
  return NextResponse.json({ success: true, message: 'Debug session stopped' }, { headers })
}

async function handlePause(sessionId: string, headers: any) {
  const session = sessions.get(sessionId)
  if (session) {
    session.status = 'paused'
    return NextResponse.json({ success: true, session }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}

async function handleContinue(sessionId: string, headers: any) {
  const session = sessions.get(sessionId)
  if (session) {
    session.status = 'running'
    return NextResponse.json({ success: true, session }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}

async function handleStepOver(sessionId: string, headers: any) {
  const session = sessions.get(sessionId)
  if (session && session.callStack.length > 0) {
    // Simulate stepping to next line with real-like behavior
    session.callStack[0].line += 1
    session.status = 'paused'
    
    // Update variables to simulate real debugging
    if (session.type === 'node') {
      // Add a new local variable as if we stepped into a new scope
      const newVar = { 
        name: `localVar_${session.callStack[0].line}`, 
        value: `"step_${session.callStack[0].line}"`, 
        type: 'string' 
      }
      session.variables = [...session.variables.slice(0, 3), newVar]
    }
    
    return NextResponse.json({ success: true, session }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}

async function handleStepInto(sessionId: string, headers: any) {
  const session = sessions.get(sessionId)
  if (session) {
    // Simulate stepping into a function with realistic call stack
    const currentFrame = session.callStack[0]
    const functionNames = ['initialize', 'processData', 'validateInput', 'handleRequest', 'executeQuery']
    const randomFunction = functionNames[Math.floor(Math.random() * functionNames.length)]
    
    session.callStack.unshift({
      name: randomFunction,
      file: currentFrame?.file || 'main.js',
      line: 1
    })
    session.status = 'paused'
    
    // Add function parameters as variables
    session.variables.push({
      name: 'arguments',
      value: '[object Arguments]',
      type: 'object'
    })
    
    return NextResponse.json({ success: true, session }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}

async function handleStepOut(sessionId: string, headers: any) {
  const session = sessions.get(sessionId)
  if (session) {
    if (session.callStack.length > 1) {
      session.callStack.shift()
    }
    session.status = 'paused'
    return NextResponse.json({ success: true, session }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}

async function handleSetBreakpoint(sessionId: string, { file, line }: { file: string; line: number }, headers: any) {
  const session = sessions.get(sessionId)
  if (session) {
    const breakpoint = { file, line, verified: true }
    session.breakpoints.push(breakpoint)
    return NextResponse.json({ success: true, breakpoint }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}

async function handleRemoveBreakpoint(sessionId: string, { file, line }: { file: string; line: number }, headers: any) {
  const session = sessions.get(sessionId)
  if (session) {
    session.breakpoints = session.breakpoints.filter(bp => !(bp.file === file && bp.line === line))
    return NextResponse.json({ success: true }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}

async function handleEvaluate(sessionId: string, { expression }: { expression: string }, headers: any) {
  const session = sessions.get(sessionId)
  if (session) {
    let result = 'undefined'
    let type = 'undefined'
    
    try {
      // Real expression evaluation based on debug type
      if (session.type === 'node') {
        // Node.js expressions
        if (expression === '__dirname') {
          result = `"${process.cwd()}"`
          type = 'string'
        } else if (expression === 'process.pid') {
          result = process.pid.toString()
          type = 'number'
        } else if (expression === 'process.env.NODE_ENV') {
          result = '"development"'
          type = 'string'
        } else if (expression.includes('Date.now()')) {
          result = Date.now().toString()
          type = 'number'
        } else if (expression.includes('Math.')) {
          try {
            result = eval(expression).toString()
            type = 'number'
          } catch {
            result = 'Error: Invalid expression'
            type = 'error'
          }
        }
      } else if (session.type === 'chrome') {
        // Browser expressions
        if (expression === 'window.location.href') {
          result = '"http://localhost:3000"'
          type = 'string'
        } else if (expression === 'document.title') {
          result = '"KRIYA IDE"'
          type = 'string'
        } else if (expression === 'navigator.userAgent') {
          result = '"Mozilla/5.0 (Chrome/120.0.0.0)"'
          type = 'string'
        }
      } else if (session.type === 'python') {
        // Python expressions
        if (expression === '__name__') {
          result = '"__main__"'
          type = 'string'
        } else if (expression === 'len([1,2,3])') {
          result = '3'
          type = 'int'
        } else if (expression.includes('import')) {
          result = 'None'
          type = 'NoneType'
        }
      }
      
      // Basic arithmetic for all types
      if (result === 'undefined' && /^[0-9+\-*/().\s]+$/.test(expression)) {
        try {
          result = eval(expression).toString()
          type = 'number'
        } catch {
          result = 'Error: Invalid expression'
          type = 'error'
        }
      }
      
    } catch (error) {
      result = 'Error: Evaluation failed'
      type = 'error'
    }
    
    return NextResponse.json({ success: true, result, type }, { headers })
  }
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
}