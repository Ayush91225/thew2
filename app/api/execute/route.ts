import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace')
const TIMEOUT = 5000
const MAX_CODE_SIZE = 50000

interface ExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
}

const SAFE_LANGUAGES = {
  javascript: { extension: '.js', runtime: 'node' },
  js: { extension: '.js', runtime: 'node' },
  python: { extension: '.py', runtime: 'python3' },
  py: { extension: '.py', runtime: 'python3' }
}

const NON_EXECUTABLE = ['html', 'css', 'json', 'markdown', 'md', 'typescript', 'ts', 'plaintext', 'text']

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'temp'
}

function validateCode(code: string): boolean {
  if (!code || typeof code !== 'string' || code.length > MAX_CODE_SIZE) return false
  
  // Block only the most dangerous patterns
  const dangerousPatterns = [
    /require\s*\(\s*['"]child_process['"]/,
    /import.*child_process/,
    /exec\s*\(/,
    /spawn\s*\(/
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(code))
}

const handleError = (message: string, status = 500) => 
  NextResponse.json({ success: false, error: message }, { status })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API received:', { 
      hasCode: !!body.code, 
      language: body.language, 
      filename: body.filename,
      codeLength: body.code?.length 
    })
    
    const { code, language, filename } = body
    
    if (!code || !language) {
      console.log('Missing required fields:', { code: !!code, language: !!language })
      return handleError('Code and language required', 400)
    }
    
    if (!code.trim()) {
      console.log('Empty code provided')
      return handleError('Code cannot be empty', 400)
    }

    if (!validateCode(code)) {
      console.log('Code validation failed')
      return handleError('Invalid or unsafe code', 400)
    }

    if (NON_EXECUTABLE.includes(language)) {
      console.log('Non-executable language:', language)
      return NextResponse.json({
        success: true,
        output: 'File ready for preview',
        executionTime: 0
      })
    }

    const config = SAFE_LANGUAGES[language as keyof typeof SAFE_LANGUAGES]
    if (!config) {
      console.log('Unsupported language:', language)
      return handleError('Unsupported language', 400)
    }

    const result = await executeCode(code, config, sanitizeFilename(filename || 'temp'))
    return NextResponse.json(result)

  } catch (error) {
    console.error('API error:', error)
    return handleError('Execution failed')
  }
}

async function executeCode(
  code: string, 
  config: { extension: string; runtime: string },
  filename: string
): Promise<ExecutionResult> {
  const startTime = Date.now()
  
  try {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true })
    
    const tempFile = path.join(WORKSPACE_DIR, `${filename}${config.extension}`)
    
    // Ensure file is within workspace
    if (!tempFile.startsWith(WORKSPACE_DIR)) {
      throw new Error('Invalid file path')
    }
    
    await fs.writeFile(tempFile, code, 'utf-8')

    const { stdout, stderr } = await execAsync(`${config.runtime} "${path.basename(tempFile)}"`, {
      timeout: TIMEOUT,
      cwd: WORKSPACE_DIR
    })

    await fs.unlink(tempFile).catch(() => {})

    return {
      success: !stderr,
      output: (stdout || stderr).slice(0, 10000),
      executionTime: Date.now() - startTime
    }

  } catch {
    return {
      success: false,
      error: 'Execution failed',
      executionTime: Date.now() - startTime
    }
  }
}